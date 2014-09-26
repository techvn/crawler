/**
 * Created by Administrator PC on 9/14/14.
 */
var utils = require('./../../utils/Utils').Utils,
    voteModel = require('./../../model/TF_Votes'),
    playerModel = require('./../../model/TF_Player'),
    matchModel = require('./../../model/TF_Matches'),
    users = require('./../../model/TF_Users'),
    usersFollow = require('./../../model/TF_UsersFollow'),
    news = require('./../../model/TF_News'),
    video = require('./../../model/TF_Video'),
    tennisStat = require('./../../utils/TennisMatchStat').TennisMatchStat,
//histories_detail = require('./../../model/TF_HistoriesDetail'),
//histories_statistic = require('./../../model/TF_Histories'),
    historyModel = require('./../../model/TF_Histories'),
    historyDetailModel = require('./../../model/TF_HistoriesDetail');
function Get() {
    var self = this;

    // Load players
    self.getPlayer = function (req, res) {
        var con = '', oparator = '',
            kw = req.query.kw || '',
            order = req.query.order || 'id',
            order_type = req.query.order_type || 'desc',
            limit = req.query.limit || '0, 10',
            type = req.query.type || '',
            action = req.query.action || 'search',
            field = '';

        if (type.toUpperCase() == 'ATP') {
            type = 1;
        } else if (type.toUpperCase() == 'WTA') {
            type = 0;
        } else {
            type = null;
        }

        if (type != null) {
            con += oparator + '`gender`=' + type;
            oparator = ' AND ';
        }
        if (kw != '') {
            con += oparator + '`name` LIKE "%' + kw + '%"';
        }

        // If search action, send full player data
        if (action == 'search') {
            field = '`id`,`name`,`avatar`,`birth`,`des`,`country`,`twitter`';
        } else { // Send id, name for suggest
            field = '`id`,`name`';
        }

        playerModel.PlayerModel.getList(field, con, '`' + order + '` ' + order_type, limit, function (result, err) {
            res.json(err || result);
        });
    }

    // Get player detail
    // Params: id
    self.getPlayerDetail = function (req, res) {
        // Load player
        var player_id = req.query.id || 0;
        playerModel.PlayerModel.getDetail('id,name,avatar,birth,country,des,twitter', '`id`=' + player_id, function (data, err) {
            var result = {};
            for (var o in data) {
                result = data[o];
                break;
            }

            result.matches = [];

            var players = [], load_user = false, loaded_news = false, loaded_video = false;
            news.NewsModel.getList('id,title,thumb,link', '`tag` LIKE "%' + result.name + '%"', '`posted_time` DESC', 5, function(listNews, err) {
                result.news = listNews;
                loaded_news = true;
            });
            video.VideoModel.getList('id,title,thumb,video,link',
                '`title` LIKE "%'+result.name+'%" OR `brief` LIKE "%'+result.name+'%" OR `content` LIKE "%'+result.name+'%"',
                '`posted_time` DESC', 5, function(listVideo, err) {
                    result.video = listVideo;
                    loaded_video = true;
                });
            /*result.news = [
                {
                    id: 1, title: 'test', thumb: 'link image', link: 'Link origin of news'
                },
                {
                    id: 2, title: 'test 2', thumb: 'link image 2', link: 'Link origin of news 2'
                }
            ];
            result.video = [
                {
                    id: 1, title: 'test video', thumb: 'link image of video', link: 'Link origin of news'
                },
                {
                    id: 2, title: 'test video 2', thumb: 'link image of video 2', video : 'ID of youtube', link: 'Link origin of news 2'
                }
            ];*/
            result.test = false;
            // Load matches in histories
            historyModel.HistoriesModel.getList('id,player_1,player_2', '`player_1`=' + player_id + ' OR `player_2`=' + player_id,
                null, 'all', function (data, err, refer) {
                    if (err) {
                        console.log(err);
                    }
                    var inc = 0;
                    // check get all matches before send data
                    if (data.length > 0) {
                        // Load player name
                        var player = '', comma = '';
                        for (var o in data) {
                            player += comma + data[o].player_1 + ',' + data[o].player_2;
                            comma = ',';
                        }
                        playerModel.PlayerModel.getList('id,name', '`id` IN(' + player + ')', null, 'all', function (player_data, err) {
                            // Re-order user list
                            if (player_data.length > 0) {
                                for (var o in player_data) {
                                    players[player_data[o].id] = player_data[o].name;
                                }
                            }
                            load_user = true;
                        });

                        // Load matches
                        for (var o in data) {
                            historyDetailModel.HistoryDetailModel.getList('*', '`head2head_id`=' + data[o].id, '`id` ASC', 'all', function (match_detail, err, refer) {
                                for (var o_o in match_detail) {
                                    match_detail[o_o].player_with = (refer.player_1 = player_id ? refer.player_2 : refer.player_1);
                                    result.matches.push(match_detail[o_o]);
                                }
                                inc++;
                            }, data[o]);
                        }
                    } else {
                        // No history
                        load_user = true;
                    }
                    var timer = setTimeout(function () {
                        if (inc == Object.keys(data).length & load_user & loaded_news & loaded_video) {
                            // Response data

                            if (result.matches.length > 0) {
                                for (var o in result.matches) {
                                    if (typeof players[result.matches[o].player_with] !== 'undefined') {
                                        result.matches[o].player_with = players[result.matches[o].player_with];
                                        /*result.matches[o].winner = utils.getWinner(player_id, result.matches[o].player_with, result.matches[o].score);
                                         var sql = 'UPDATE `' + historyDetailModel.HistoryDetailObject().table + '` SET `winner`=' + result.matches[o].winner + ' WHERE `id`=' + result.matches[o].id;
                                         historyDetailModel.HistoryDetailModel.executeQuery(sql, function(data, err) { });*/
                                        result.matches[o].winner = (result.matches[o].winner == player_id ? true : false);
                                    }
                                }
                            }
                            res.json(result);
                        }
                    }, 100);
                });
            // ------------------

        });
        return;
    }

    /**
     * Load today's match (in week)
     * @param req
     * @param res
     */
    self.getMatchToday = function (req, res) {

        var limit = req.query.limit || '';
        // Load matches
        var matches = [],
            players = [],
            week = utils.getWeek(null),
            year = new Date().getFullYear(),
            con = '';
        con = '`year` = "' + week + '/' + year + '"';

        matchModel.MatchModel.getList('`id`,`year`,`tournament`,`player_1`,`player_2`', con, '`id` ASC', limit, function (list_matches, err) {
            // Load list players
            if (err) {
                res.json(err);
                return;
            }
            if (list_matches.length > 0) {
                // player id
                var player_id = '', comma = '';
                for (var o in list_matches) {
                    player_id += comma + list_matches[o].player_1 + ',' + list_matches[o].player_2;
                    comma = ',';
                }
                playerModel.PlayerModel.getList('`id`,`name`,`avatar`,`win`', '`id` IN (' + player_id + ')', null, 'all', function (list_user, err) {
                    if (err) {
                        res.json(err);
                        return;
                    }
                    if (list_user.length > 0) {
                        for (var o in list_user) {
                            players[list_user[o].id] = list_user[o];
                        }
                        for (var o in list_matches) {
                            list_matches[o].player_1 = players[list_matches[o].player_1];
                            list_matches[o].player_2 = players[list_matches[o].player_2];
                        }
                    }
                    res.json(list_matches);
                });
            } else {
                // No match in database
                // 1. Crawl news match list
                // 2. Return current list if found


                res.json(list_matches);
            }
        });

    }

    /**
     * Load detail for head-to-head
     * @param rea
     * @param res
     */
    self.getHeadToHead = function (req, res) {
        // Get match detail by match id
        var match_id = req.query.id || 0, // id of match
            player_1 = req.query.player_1 || '', // name of player 1
            player_2 = req.query.player_2 || '', // name of player 2
            pid_1 = req.query.pid_1 || 0, // id of player 1 on system
            pid_2 = req.query.pid_2 || 0, // id of player 2 on system
            con = '';
        if (match_id) {
            con = '`id`=' + match_id;
        } else {
            if (pid_1 == '' | pid_1 == 0) {
                // Search and save player_1
                // and return pid_1 for this player

            }
            if (pid_2 == '' | pid_2 == 0) {
                // Search and save player_2
                // and return pid_2 for this player

            }
            con = '(`player_1`="' + pid_1 + '" AND `player_2`="' + pid_2 + '") OR (`player_2`="' + pid_1 + '" AND `player_1`="' + pid_2 + '")';
        }

        matchModel.MatchModel.getList('*', con, 'id ASC', '1', function (list_matches, err) {
            // Load list players
            if (err) {
                res.json(err);
                return;
            }
            if (list_matches.length > 0) { // Exist match, find history, if not found, add new and crawl data
                // player id
                var player_id = '', comma = '', total_voted_1 = 0, total_voted_2 = 0;
                for (var o in list_matches) {
                    player_id += comma + list_matches[o].player_1 + ',' + list_matches[o].player_2;
                    pid_1 = list_matches[o].player_1;
                    pid_2 = list_matches[o].player_2;
                    total_voted_1 = list_matches[o].total_voted_player_1;
                    delete list_matches[o].total_voted_player_1;
                    total_voted_2 = list_matches[o].total_voted_player_2;
                    delete list_matches[o].total_voted_player_2;

                    comma = ',';
                }
                var players = [];
                playerModel.PlayerModel.getList('`id`,`name`,`avatar`,`win`,`des`,`tennis_stat_id_map`', '`id` IN (' + player_id + ')', null, 'all', function (list_user, err) {
                    if (err) {
                        res.json(err);
                        return;
                    }
                    if (list_user.length > 0) {
                        for (var o in list_user) {
                            var voted = 0;
                            if (list_user[o].id == pid_1) {
                                voted = total_voted_1;
                                // Assign player name to check winner (associate with head2head_data crawled)
                                player_1 = list_user[o].name;
                            } else {
                                voted = total_voted_2;
                                // Assign player name to check winner (associate with head2head_data crawled)
                                player_2 = list_user[o].name;
                            }
                            // Load vote num here
                            list_user[o].vote = voted;
                            players[list_user[o].id] = list_user[o];
                        }
                        for (var o in list_matches) {
                            list_matches[o].player_1 = players[list_matches[o].player_1];
                            list_matches[o].player_2 = players[list_matches[o].player_2];

                            list_matches[o].matches = [];
                            // Load history of them
                            var sql = 'SELECT b.`id`, b.`year`, b.`tournament`, b.`surface`, b.`round`, b.`score`, b.`winner`, a.`player_1`, a.`player_2` FROM `histories_statistic` AS a INNER JOIN `histories_detail` AS b ON a.`id`=b.`head2head_id` WHERE ' +
                                '(a.`player_1`=' + list_matches[o].player_1.id + ' AND a.`player_2`=' + list_matches[o].player_2.id + ')'
                                + ' OR (a.`player_2`=' + list_matches[o].player_1.id + ' AND a.`player_1`=' + list_matches[o].player_2.id + ') ORDER BY b.`id` ASC';

                            historyModel.HistoriesModel.executeQuery(sql, function (data, err, refer) {

                                if (err) {
                                    res.json(list_matches);
                                    return;
                                }

                                if (data.length > 0) {
                                    for (var _o in data) {
                                        // Count win score for user
                                        if(list_matches[refer].player_1.id == data[_o].winner) {
                                            list_matches[refer].player_1.win++;
                                        } else {
                                            list_matches[refer].player_2.win++;
                                        }
                                        data[_o].player_with = (data[_o].winner == data[_o].player_1 ? players[data[_o].player_2].name : players[data[_o].player_1].name);
                                        data[_o].winner = (players[data[_o].winner] != undefined ? players[data[_o].winner].name : '');
                                        delete data[_o].player_1;
                                        delete data[_o].player_2;
                                        list_matches[refer].matches.push(data[_o]);
                                    }
                                    list_matches = list_matches[refer];
                                    res.json(list_matches);
                                } else {

                                    pid_1 = list_matches[refer].player_1.id;
                                    pid_2 = list_matches[refer].player_2.id;
                                    var map_id_1 = players[pid_1].tennis_stat_id_map,
                                        map_id_2 = players[pid_2].tennis_stat_id_map;

                                    // Crawl data history for this current two player
                                    // 1. Check stat exist
                                    historyModel.HistoriesModel.getDetail('`id`',
                                        '(`player_1`=' + list_matches[refer].player_1.id + ' AND `player_2`=' + list_matches[refer].player_2.id + ') ' +
                                            'OR (`player_1`=' + list_matches[refer].player_2.id + ' AND `player_2`=' + list_matches[refer].player_1.id + ')',
                                        function (histories, err) {
                                            if (err) {
                                                console.log(err);
                                                res.json(list_matches[refer]);
                                                return;
                                            }
                                            var histories_statistic_id = 0;
                                            if (histories.length > 0) { // Exist
                                                for (var i in histories) {
                                                    histories = histories[i];
                                                    break;
                                                }
                                                histories_statistic_id = histories.id;

                                                // 2. a. Crawl data in case history has existed
                                                var url = 'http://tennis.matchstat.com/index.php?ControllerName=Compare&Id_Player1='
                                                    + map_id_1 + '&Id_Player2=' + map_id_2;

                                                tennisStat.LoadHeadToHead(url, function (head2head_data, err) {
                                                    // Add headToHead id for this data
                                                    for (var o in head2head_data) {
                                                        var param1 = pid_1, param2 = pid_2;
                                                        if (head2head_data[o].player_1 == player_1) {
                                                            param1 = pid_1;
                                                            param2 = pid_2;
                                                        } else {
                                                            param1 = pid_2;
                                                            param2 = pid_1;
                                                        }

                                                        head2head_data[o].head2head_id = histories_statistic_id;
                                                        head2head_data[o].winner = utils.getWinner(param1, param2, head2head_data[o].score);

                                                        // Delete key
                                                        delete head2head_data[o].player_1;
                                                        delete head2head_data[o].player_2;
                                                    }

                                                    // 4. Add histories detail for this match
                                                    historyDetailModel.HistoryDetailModel.insertMulti(head2head_data, function (data, err) {
                                                        // Done
                                                        if (err) {
                                                            console.log(err);
                                                            list_matches[refer].error = err;
                                                            res.send(list_matches[refer]); // Response data
                                                            return;
                                                        }

                                                        // 5. List current match again from database
                                                        var sql = 'SELECT b.`id`, b.`year`, b.`tournament`, b.`surface`, b.`round`, b.`score`, b.`winner`, a.`player_1`, a.`player_2` ' +
                                                            'FROM `histories_statistic` AS a INNER JOIN `histories_detail` AS b ON a.`id`=b.`head2head_id` WHERE ' +
                                                            '(a.`player_1`=' + pid_1 + ' AND a.`player_2`=' + pid_2 + ')' +
                                                            ' OR (a.`player_2`=' + pid_1 + ' AND a.`player_1`=' + pid_2 + ') ORDER BY b.`id` ASC';

                                                        historyModel.HistoriesModel.executeQuery(sql, function (data, err) {
                                                            if (err) {
                                                                console.log(err);
                                                                res.json({}); // Response data
                                                                return;
                                                            }

                                                            list_matches[refer].matches = [];
                                                            if (data.length > 0) {
                                                                for (var _o in data) {
                                                                    // Count win score for user
                                                                    if(list_matches[refer].player_1.id == data[_o].winner) {
                                                                        list_matches[refer].player_1.win++;
                                                                    } else {
                                                                        list_matches[refer].player_2.win++;
                                                                    }

                                                                    data[_o].player_with = (
                                                                        data[_o].winner == data[_o].player_1 ? players[data[_o].player_2].name : players[data[_o].player_1].name);
                                                                    data[_o].winner = (players[data[_o].winner] != undefined ? players[data[_o].winner].name : '');
                                                                    delete data[_o].player_1;
                                                                    delete data[_o].player_2;

                                                                    list_matches[refer].matches.push(data[_o]);
                                                                }
                                                            }
                                                            // 6. Response data after crawl finished
                                                            res.json(list_matches[refer]);
                                                            // -----------
                                                        });
                                                    });
                                                });
                                            } else { // Not exist, add new history before try crawl data
                                                historyModel.HistoriesModel.insertSingle({player_1: pid_1, player_2: pid_2}, function (histories, err) {
                                                    if (err || histories.insertId == 0) {
                                                        console.log(err);
                                                        list_matches[refer].err = (err ? err : 'Insert new stat fail');
                                                        res.json(list_matches[refer]);
                                                        return;
                                                    }
                                                    // Insert stat success
                                                    histories_statistic_id = histories.insertId;
                                                    // 2. b. Crawl data in case history has existed
                                                    var url = 'http://tennis.matchstat.com/index.php?ControllerName=Compare&Id_Player1='
                                                        + map_id_1 + '&Id_Player2=' + map_id_2;

                                                    tennisStat.LoadHeadToHead(url, function (head2head_data, err) {
                                                        // Add headToHead id for this data
                                                        for (var o in head2head_data) {
                                                            var param1 = pid_1, param2 = pid_2;
                                                            if (head2head_data[o].player_1 == player_1) {
                                                                param1 = pid_1;
                                                                param2 = pid_2;
                                                            } else {
                                                                param1 = pid_2;
                                                                param2 = pid_1;
                                                            }

                                                            head2head_data[o].head2head_id = histories_statistic_id;
                                                            head2head_data[o].winner = utils.getWinner(param1, param2, head2head_data[o].score);

                                                            // Delete key
                                                            delete head2head_data[o].player_1;
                                                            delete head2head_data[o].player_2;
                                                        }

                                                        // 3. Add histories detail for this match
                                                        historyDetailModel.HistoryDetailModel.insertMulti(head2head_data, function (data, err) {
                                                            // Done
                                                            if (err) {
                                                                console.log(err);
                                                                list_matches[refer].error = err;
                                                                res.send(list_matches[refer]); // Response data
                                                                return;
                                                            }

                                                            // 5. List current match again from database
                                                            var sql = 'SELECT b.`id`, b.`year`, b.`tournament`, b.`surface`, b.`round`, b.`score`, b.`winner`, a.`player_1`, a.`player_2` ' +
                                                                'FROM `histories_statistic` AS a INNER JOIN `histories_detail` AS b ON a.`id`=b.`head2head_id` WHERE ' +
                                                                '(a.`player_1`=' + pid_1 + ' AND a.`player_2`=' + pid_2 + ')' +
                                                                ' OR (a.`player_2`=' + pid_1 + ' AND a.`player_1`=' + pid_2 + ') ORDER BY b.`id` ASC';

                                                            historyModel.HistoriesModel.executeQuery(sql, function (data, err) {
                                                                if (err) {
                                                                    console.log(err);
                                                                    res.json({}); // Response data
                                                                    return;
                                                                }
                                                                list_matches[refer].matches = [];
                                                                if (data.length > 0) {
                                                                    for (var _o in data) {

                                                                        // Count win score for user
                                                                        if(list_matches[refer].player_1.id == data[_o].winner) {
                                                                            list_matches[refer].player_1.win++;
                                                                        } else {
                                                                            list_matches[refer].player_2.win++;
                                                                        }

                                                                        data[_o].player_with = (
                                                                            data[_o].winner == data[_o].player_1 ? players[data[_o].player_2].name : players[data[_o].player_1].name);
                                                                        data[_o].winner = (players[data[_o].winner] != undefined ? players[data[_o].winner].name : '');
                                                                        delete data[_o].player_1;
                                                                        delete data[_o].player_2;

                                                                        list_matches[refer].matches.push(data[_o]);
                                                                    }
                                                                }
                                                                // 6. Response data after crawl finished
                                                                res.json(list_matches[refer]);
                                                                // -----------
                                                            });
                                                        });
                                                    });
                                                });
                                            }
                                        });
                                }
                                /*list_matches = list_matches[refer];
                                res.json(list_matches);*/
                            }, o);
                        }
                    } else {
                        // Crawl list match for history
                        list_matches = list_matches[o];
                        res.json(list_matches);
                    }
                });
            } else {
                //console.log('go here');
                // ------- Crawl data history here
                // 1. Load player id of tennis.matchstat.com
                playerModel.PlayerModel.getList('`id`, `tennis_stat_id_map`,`name`,`avatar`,`win`,`des`', '`id` IN (' + pid_1 + ',' + pid_2 + ')', null, null,
                    function (player, err) {
                        if (err) {
                            console.log(err);
                            res.json({});
                            return;
                        }
                        var map_id_1 = 0, map_id_2 = 0,
                            head2head = { matches: [] }; // Data will be response
                        if (player.length > 0) {
                            var tmp_player = {};
                            for (var o in player) {
                                if (player[o].id == pid_1) {
                                    map_id_1 = player[o].tennis_stat_id_map;
                                    player_1 = player[o].name;
                                    head2head['player_1'] = player[o];
                                } else {
                                    map_id_2 = player[o].tennis_stat_id_map;
                                    player_2 = player[o].name;
                                    head2head['player_2'] = player[o];
                                }
                                tmp_player[player[o].id] = player[o];
                                //tmp_player[player[o].name] = player[o];
                            }
                            player = tmp_player;

                            // Check has history
                            historyModel.HistoriesModel.getDetail('`id`',
                                '(`player_1`=' + pid_1 + ' AND `player_2`=' + pid_2 + ') OR (`player_2`=' + pid_1 + ' AND `player_1`=' + pid_2 + ')',
                                function (history, err) {
                                    if (err) {
                                        console.log(err);
                                        res.json(head2head);
                                        return;
                                    }
                                    var histories_statistic_id = 0;
                                    if (history.length == 0) { // Have no history
                                        // 2. Crawl matches history
                                        var url = 'http://tennis.matchstat.com/index.php?ControllerName=Compare&Id_Player1='
                                            + map_id_1 + '&Id_Player2=' + map_id_2;

                                        //console.log(url);

                                        tennisStat.LoadHeadToHead(url, function (head2head_data, err) {
                                            var result = {};
                                            result.player_1 = pid_1;
                                            result.player_2 = pid_2;

                                            // Check win, lose by head2head_data
                                            // ...........
                                            result.player1_win = 0;
                                            result.player2_win = 0;

                                            // 3. Create new history statistic
                                            historyModel.HistoriesModel.insertSingle(result, function (histories_data, err) {

                                                if (err) {
                                                    console.log(err);
                                                    res.json({}); // Response data
                                                    return;
                                                }

                                                histories_statistic_id = histories_data['insertId'];

                                                // Add headToHead id for this data
                                                for (var o in head2head_data) {
                                                    var param1 = pid_1, param2 = pid_2;
                                                    if (head2head_data[o].player_1 == player_1) {
                                                        param1 = pid_1;
                                                        param2 = pid_2;
                                                    } else {
                                                        param1 = pid_2;
                                                        param2 = pid_1;
                                                    }

                                                    head2head_data[o].head2head_id = histories_statistic_id;
                                                    head2head_data[o].winner = utils.getWinner(param1, param2, head2head_data[o].score);

                                                    // Delete key
                                                    delete head2head_data[o].player_1;
                                                    delete head2head_data[o].player_2;
                                                }

                                                // 4. Add histories detail for this match
                                                historyDetailModel.HistoryDetailModel.insertMulti(head2head_data, function (data, err) {
                                                    // Done
                                                    if (err) {
                                                        console.log(err);
                                                        head2head['err'] = err;
                                                        res.send(head2head); // Response data
                                                        return;
                                                    }

                                                    // 5. List current match again from database
                                                    var sql = 'SELECT b.`id`, b.`year`, b.`tournament`, b.`surface`, b.`round`, b.`score`, b.`winner`, a.`player_1`, a.`player_2` ' +
                                                        'FROM `histories_statistic` AS a INNER JOIN `histories_detail` AS b ON a.`id`=b.`head2head_id` WHERE ' +
                                                        '(a.`player_1`=' + pid_1 + ' AND a.`player_2`=' + pid_2 + ')' +
                                                        ' OR (a.`player_2`=' + pid_1 + ' AND a.`player_1`=' + pid_2 + ') ORDER BY b.`id` ASC';

                                                    historyModel.HistoriesModel.executeQuery(sql, function (data, err) {
                                                        if (err) {
                                                            console.log(err);
                                                            res.json({}); // Response data
                                                            return;
                                                        }

                                                        /*head2head.list = data;
                                                         head2head.player = player;
                                                         res.json(head2head); return;*/

                                                        if (data.length > 0) {
                                                            for (var _o in data) {
                                                                // Count win score for user
                                                                if(head2head.player_1.id == data[_o].winner) {
                                                                    head2head.player_1.win++;
                                                                } else {
                                                                    head2head.player_2.win++;
                                                                }
                                                                data[_o].player_with = (
                                                                    data[_o].winner == data[_o].player_1 ? player[data[_o].player_2].name : player[data[_o].player_1].name);
                                                                data[_o].winner = (player[data[_o].winner] != undefined ? player[data[_o].winner].name : '');
                                                                delete data[_o].player_1;
                                                                delete data[_o].player_2;

                                                                head2head.matches.push(data[_o]);
                                                            }
                                                        }
                                                        // 6. Response data after crawl finished
                                                        res.json(head2head);
                                                        // -----------
                                                    });
                                                })
                                            });
                                        });
                                    } else {
                                        // Check have list match history
                                        // List current match again from database
                                        var sql = 'SELECT b.`id`, b.`year`, b.`tournament`, b.`surface`, b.`round`, b.`score`, b.`winner`, a.`player_1`, a.`player_2` ' +
                                            'FROM `histories_statistic` AS a INNER JOIN `histories_detail` AS b ON a.`id`=b.`head2head_id` WHERE ' +
                                            '(a.`player_1`=' + pid_1 + ' AND a.`player_2`=' + pid_2 + ')' +
                                            ' OR (a.`player_2`=' + pid_1 + ' AND a.`player_1`=' + pid_2 + ') ORDER BY b.`id` ASC';

                                        historyModel.HistoriesModel.executeQuery(sql, function (data, err) {
                                            if (err) {
                                                console.log(err);
                                                res.json({}); // Response data
                                                return;
                                            }
                                            if (data.length > 0) {
                                                for (var _o in data) {
                                                    // Count win score for user
                                                    if(head2head.player_1.id == data[_o].winner) {
                                                        head2head.player_1.win++;
                                                    } else {
                                                        head2head.player_2.win++;
                                                    }
                                                    data[_o].player_with = (
                                                        data[_o].winner == data[_o].player_1 ? player[data[_o].player_2].name : player[data[_o].player_1].name);
                                                    data[_o].winner = (player[data[_o].winner] != undefined ? player[data[_o].winner].name : '');
                                                    delete data[_o].player_1;
                                                    delete data[_o].player_2;

                                                    head2head.matches.push(data[_o]);
                                                }
                                                // Response data after crawl finished
                                                res.json(head2head);
                                            } else {
                                                // Crawl new data
                                                // 2. Crawl matches history
                                                var url = 'http://tennis.matchstat.com/index.php?ControllerName=Compare&Id_Player1='
                                                    + map_id_1 + '&Id_Player2=' + map_id_2;

                                                //console.log(url);

                                                tennisStat.LoadHeadToHead(url, function (head2head_data, err) {

                                                    for (var o in history) {
                                                        histories_statistic_id = history[o].id;
                                                        break;
                                                    }

                                                    // Add headToHead id for this data
                                                    for (var o in head2head_data) {
                                                        var param1 = pid_1, param2 = pid_2;
                                                        if (head2head_data[o].player_1 == player_1) {
                                                            param1 = pid_1;
                                                            param2 = pid_2;
                                                        } else {
                                                            param1 = pid_2;
                                                            param2 = pid_1;
                                                        }

                                                        head2head_data[o].head2head_id = histories_statistic_id;
                                                        head2head_data[o].winner = utils.getWinner(param1, param2, head2head_data[o].score);

                                                        // Delete key
                                                        delete head2head_data[o].player_1;
                                                        delete head2head_data[o].player_2;
                                                    }

                                                    // 4. Add histories detail for this match
                                                    historyDetailModel.HistoryDetailModel.insertMulti(head2head_data, function (data, err) {
                                                        // Done
                                                        if (err) {
                                                            console.log(err);
                                                            head2head['err'] = err;
                                                            res.send(head2head); // Response data
                                                            return;
                                                        }

                                                        // 5. List current match again from database
                                                        var sql = 'SELECT b.`id`, b.`year`, b.`tournament`, b.`surface`, b.`round`, b.`score`, b.`winner`, a.`player_1`, a.`player_2` ' +
                                                            'FROM `histories_statistic` AS a INNER JOIN `histories_detail` AS b ON a.`id`=b.`head2head_id` WHERE ' +
                                                            '(a.`player_1`=' + pid_1 + ' AND a.`player_2`=' + pid_2 + ')' +
                                                            ' OR (a.`player_2`=' + pid_1 + ' AND a.`player_1`=' + pid_2 + ') ORDER BY b.`id` ASC';

                                                        historyModel.HistoriesModel.executeQuery(sql, function (data, err) {
                                                            if (err) {
                                                                console.log(err);
                                                                res.json({}); // Response data
                                                                return;
                                                            }

                                                            /*head2head.list = data;
                                                             head2head.player = player;
                                                             res.json(head2head); return;*/

                                                            if (data.length > 0) {
                                                                for (var _o in data) {
                                                                    // Count win score for user
                                                                    if(head2head.player_1.id == data[_o].winner) {
                                                                        head2head.player_1.win++;
                                                                    } else {
                                                                        head2head.player_2.win++;
                                                                    }
                                                                    data[_o].player_with = (
                                                                        data[_o].winner == data[_o].player_1 ? player[data[_o].player_2].name : player[data[_o].player_1].name);
                                                                    data[_o].winner = (player[data[_o].winner] != undefined ? player[data[_o].winner].name : '');
                                                                    delete data[_o].player_1;
                                                                    delete data[_o].player_2;

                                                                    head2head.matches.push(data[_o]);
                                                                }
                                                            }
                                                            // 6. Response data after crawl finished
                                                            res.json(head2head);
                                                            // -----------
                                                        });
                                                    });
                                                });
                                            }
                                            // -----------
                                        });
                                    }
                                });
                        } else {
                            // Empty data
                            res.json({});
                        }
                    });
                // End if -----------------
            }
        });
    }


    // News --------------
    self.getListNews = function (req, res) {

        var limit = req.query.limit || '0,10',
            kw = req.query.kw || '',
            order = req.query.order || 'posted_time',
            order_type = req.query.order_type || 'DESC';
        conn = '1=1';
        if (kw) {
            conn = '`title` LIKE "%' + kw + '%" OR `brief` LIKE "%' + kw + '%"';
        }

        news.NewsModel.getList('`id`,`title`,`thumb`,`brief`,`link`', conn, '`' + order + '` ' + order_type, limit, function (result, err) {
            res.json(err || result);
        });

        /*var result = [
         {
         id: 1,
         title: 'Title of news',
         brief: 'Brief for news',
         link: 'Link detail of news if don\'t have crawled content',
         'thumb': 'Link to thumb image'
         },
         {
         id: 2,
         title: 'Title of news',
         brief: 'Brief for news',
         link: 'Link detail of news if don\'t have crawled content',
         'thumb': 'Link to thumb image'
         }
         ];
         res.json(result);*/
    }

    self.getNewsDetail = function (req, res) {
        var news_id = req.query.id || 0;
        news.NewsModel.getDetail('*', '`id`=' + news_id, function (result, err) {
            if (!err) {
                for (var o in result) {
                    result[o].created_time = result[o].created_time.toString();
                    result = result[o];
                    break;
                }
            }
            res.json(err || result);
        })
        /*var result = {
         id: 1,
         title: 'Title of news',
         brief: 'Brief for news',
         link: 'Link detail of news if don\'t have crawled content',
         'thumb': 'Link to thumb image',
         content: 'Full description text hear'
         };
         res.json(result);*/
    }

    // Video -------------
    self.getListVideo = function (req, res) {
        var limit = req.query.limit || '0,10',
            kw = req.query.kw || '',
            conn = '1=1';
        if (kw) {
            conn = '`title` LIKE "%' + kw + '%" OR `brief` LIKE "%' + kw + '%"';
        }

        video.VideoModel.getList('`id`,`title`,`thumb`,`brief`,`link`,`video`, `posted_time`', conn, '`id` DESC', limit, function (result, err) {
            res.json(err || result);
        })
        /*var result = [
         {
         id: 1,
         title: 'Title of video video',
         brief: 'Brief for video',
         thumb: 'Link to thumb image'
         },
         {
         id: 2,
         title: 'Title of video video',
         brief: 'Brief for video',
         thumb: 'Link to thumb image'
         }
         ];
         res.json(result);*/
    }
    self.getVideoDetail = function (req, res) {
        var news_id = req.query.id || 0;
        video.VideoModel.getDetail('*', '`id`=' + news_id, function (result, err) {
            if (!err) {
                for (var o in result) {
                    result[o].created_time = result[o].created_time.toString();
                    result = result[o];
                    break;
                }
            }
            res.json(err || result);
        })
        /*var result = {
         id: 1,
         title: 'Title of video',
         brief: 'Brief for video',
         link: 'Link detail of news if don\'t have crawled content',
         thumb: 'Link to thumb image',
         content: 'Full description text hear',
         video: 'iframe embed or id of youtube link'
         };
         res.json(result);*/
    }

    // Follow -------------
    self.getHasFollow = function (req, res) {
        var device_id = req.query.device_id || '',
            player_id = req.query.player_id || 0,
            user_id = req.query.user_id || 0;

        if (user_id == 0) {
            users.UsersModel.getDetail('*', "`device_id`='" + device_id + "'", function (data, err) {
                if (err || data.length == 0) {
                    console.log(err);
                    res.json({result: 0, message: 'User can\'t found'});
                    return;
                }
                for (var o in data) {
                    data = data[o];
                }
                usersFollow.UsersFollowModel.getDetail('`id`', function (data, err, user) {
                    if (err) {
                        console.log(err);
                        res.json({result: 0, message: 'Hasn\'t followed'});
                        return;
                    }
                    if (data.length == 0) {
                        res.json({result: 0, message: 'Hasn\'t followed'});
                        return;
                    }
                    res.json({result: 1, message: user.email});
                }, data);
            });
        }
    }
    self.getListFollow = function (req, res) {
        var device_id = req.query.device_id || '',
            user_id = req.query.user_id || 0;
        users.UsersModel.getDetail('`id`', '`device_id`="' + device_id + '"', function (data, err) {
            if (data.length == 0 || err) {
                console.log(err);
                res.json([]);
                return;
            }
            // Get first element in array
            for (var o in data) {
                data = data[o];
            }
            var sql = "SELECT b.`id`, b.`name`, b.`avatar`, b.`twitter` " +
                "FROM `users_follow` AS a INNER JOIN `players` AS b ON a.`player_id` = b.`id` " +
                "WHERE a.`user_id`=" + data.id;
            usersFollow.UsersFollowModel.executeQuery(sql, function (result, err) {
                if(err) {
                    console.log(err);
                }
                res.json(err ? [] : result);
            });
        });
    }

    // Check user voted or not by user_id, match_id and player ----------------
    self.getCheckUserVote = function (req, res) {
        var result = {};
        result['voted'] = true;
        result['vote_player'] = 1;

        res.json(result);
    }

}
exports.Get = new Get();