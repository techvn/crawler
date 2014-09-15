/**
 * Created by Administrator PC on 9/13/14.
 */
var utils = require('./../../utils/Utils').Utils,
    matches = require('./../../model/TF_Matches'),
    players = require('./../../model/TF_Player'),
    histories_statistic = require('./../../model/TF_Histories'),
    histories_detail = require('./../../model/TF_HistoriesDetail');
tennisStat = require('./../../utils/TennisMatchStat').TennisMatchStat;

function Crawler() {
    var self = this;
    /**
     * Crawl list today's matches
     * @param req
     * @param res
     */
    self.getMatchToday = function (req, res) {
        var url = 'http://tennis.matchstat.com/AllFixtures/';
        tennisStat.LoadMatchToday(url, function (data, error) {
            if (data.length > 0) {
                console.log('start: ' + new Date().toTimeString());
                // Check insert or get id of player
                var __players = [],
                    player_1 = '',
                    player_2 = '';

                for (var o = 0; o < data.length; o++) {
                    player_1 = {name: data[o].player_1};
                    __players.push(player_1);
                    player_2 = {name: data[o].player_2};
                    __players.push(player_2);
                }

                // Insert all player
                players.PlayerModel.insertMulti(__players, function (__data, err) {
                    // Load id of this players
                    var list_players = '', comma = '';
                    for (var o in __players) {
                        list_players += comma + "'" + __players[o].name + "'";
                        comma = ',';
                    }
                    players.PlayerModel.getList('`id`,`name`', "`name` IN (" + list_players + ")", null, 999999, function (__data, err) {
                        delete __players;
                        __players = {};
                        for (var o in __data) {
                            __players[__data[o].name] = __data[o].id;
                        }
                        // Replace name with id of player
                        for (var o in data) {
                            if (typeof __players[data[o].player_1] !== 'undefined') {
                                data[o].player_1 = __players[data[o].player_1];
                            }
                            if (typeof __players[data[o].player_2] !== 'undefined') {
                                data[o].player_2 = __players[data[o].player_2];
                            }
                        }
                        // Insert today's matches to database
                        matches.MatchModel.insertMulti(data, function (data, err) {
                            res.json(error || data);
                        })
                    })
                });
            }
        });
    }

    /**
     * Update id of player from tennis.matchStat.com
     * @param req
     * @param res
     */
    self.getMapPlayer = function (req, res) {
        var temp = 'http://tennis.matchstat.com/Player/',
            url = '';
        // Load all player not map
        players.PlayerModel.getList('`id`, `name`', '`tennis_stat_id_map` IS NULL OR `tennis_stat_id_map` = 0', null, 9999, function (data, err) {
            if (!err) {
                for (var o in data) {
                    url = temp + escape(data[o].name);
                    tennisStat.LoadDetailPlayer(url, function (result, err, refer) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        // Update player info
                        var sql = 'UPDATE `' + players.PlayerObject().table + '` SET `tennis_stat_id_map`=' + result.tennis_stat_id_map
                            + ', `birth`="' + result.birth + '" WHERE `id`=' + refer;
                        players.PlayerModel.executeQuery(sql, function (data, err) {
                        });
                    }, data[o].id);
                }
            }
            res.json(data);
        });
    }

    /**
     * Get stat by players
     * @param req
     * @param res
     */
    self.getStats = function (req, res) {
        var player_1 = req.query.player_1 || 0;
        var player_2 = req.query.player_2 || 0;
        var map_player_1_id = req.query.map_1 || 0;
        var map_player_2_id = req.query.map_2 || 0;

        var url = 'http://tennis.matchstat.com/index.php?ControllerName=Compare&Id_Player1='
            + map_player_1_id + '&Id_Player2=' + map_player_2_id;
        console.log(url);

        tennisStat.LoadHeadToHead(url, function (head2head_data, err) {
            // Check has been history statistic
            histories_statistic.HistoriesModel.getDetail('`id`', '`player_1`=' + player_1 + ' AND player_2=' + player_2, function (data_detail, err) {
                if (err) {
                    console.log(err);
                    return;
                }
                var histories_statistic_id = 0;
                if (data_detail.length > 0) { // Existed
                    for (var o in data_detail) {
                        histories_statistic_id = data_detail[o].id;
                        break;
                    }
                    // Add headToHead id for this data
                    for (var o in head2head_data) {
                        head2head_data[o].head2head_id = histories_statistic_id;
                    }
                    // Add histories detail for this match
                    histories_detail.HistoryDetailModel.insertMulti(head2head_data, function (data, err) {
                        // Done
                        if(err) {
                            console.log(err);
                        }
                    });

                } else { // Not existed, so insert new history statistic
                    var result = {};
                    result.player_1 = player_1;
                    result.player_2 = player_2;

                    // Check win, lose by head2head_data
                    // ...........
                    result.player1_win = 0;
                    result.player2_win = 0;

                    histories_statistic.HistoriesModel.insertSingle(result, function (histories_data, err) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        for (var o in histories_data) {
                            histories_statistic_id = histories_data[o].id;
                            break;
                        }
                        // Add headToHead id for this data
                        for (var o in head2head_data) {
                            head2head_data[o].head2head_id = histories_statistic_id;
                            head2head_data[0].winner = utils.getWinner(player_1, player_2, head2head_data[0].score);
                        }
                        // Add histories detail for this match
                        histories_detail.HistoryDetailModel.insertMulti(head2head_data, function (data, err) {
                            // Done
                        })
                    })
                }
            });
            res.json(head2head_data);
        });
    }

    self.getPlayerOnTennisMatchStat = function (req, res) {
        var url = 'http://tennis.matchstat.com/Player/',
            player_name = req.query.player_name || '';

        url += player_name;
        tennisStat.LoadDetailPlayer(url, function (result, err, refer) {
            if (err) {
                console.log(err);
                return;
            }
            // Check player has been existed
            players.PlayerModel.getDetail('id', '`name`="' + player_name + '"', function (data, err) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (data.length > 0) { // Update player
                    var player_id = 0;
                    for (var o in data) {
                        player_id = data[o].id;
                        break;
                    }
                    var sql = 'UPDATE `' + players.PlayerObject().table + '` SET `tennis_stat_id_map`=' + result.tennis_stat_id_map
                        + ', `birth`="' + result.birth + '" WHERE `id`=' + player_id;
                    players.PlayerModel.executeQuery(sql, function (data, err) {
                        if(!err) {
                            console.log('Update player success');
                        }
                    });
                } else {
                    // Insert new player
                    var sql = "INSERT IGNORE INTO `" + players.PlayerObject().table + "`(`name`,`tennis_stat_id_map`, `birth`)"
                        + " VALUE('" + player_name + "','" + result.tennis_stat_id_map + "','" + result.birth + "')";
                    players.PlayerModel.executeQuery(sql, function (data, err) {
                        if(!err) {
                            console.log('Add new player success');
                        }
                    });
                }
            });
            res.json(result);

        }, null);
    }
}

exports.Crawler = new Crawler();