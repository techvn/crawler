/**
 * Created by Administrator PC on 9/13/14.
 */
var utils = require('./../../utils/Utils').Utils,
    matches = require('./../../model/TF_Matches'),
    players = require('./../../model/TF_Player'),
    news = require('./../../model/TF_News'),
    newsTagMatch = require('./../../model/TagMatch_News'),
    video = require('./../../model/TF_Video'),
    histories_statistic = require('./../../model/TF_Histories'),
    wiki = require('./../../utils/WikiPediaHtmlParse').WikiPediaHtmlParse,
    tennis_news = require('./../../utils/TennisNewsHtmlParse').TennisNewsHtmlParse,
    tennis_video = require('./../../utils/YouTubeHtmlParse').YouTubeHtmlParse,
    atpWorld = require('./../../utils/AtpWorldTourHtmlParse').AtpWorldTourHtmlParse,
    wtaWorld = require('./../../utils/WtaTennisHtmlParse').WtaTennisHtmlParse,
    histories_detail = require('./../../model/TF_HistoriesDetail'),
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
    self.getMapPlayerOnTennisMatchStat = function (req, res) {
        var temp = 'http://tennis.matchstat.com/Player/',
            url = '';
        // Load all player not map
        players.PlayerModel.getList('`id`, `name`', '(`tennis_stat_id_map` IS NULL OR `tennis_stat_id_map` = "")'
            , null, 9999, function (data, err) {
            if (!err) {
                for (var o in data) {
                    url = temp + escape(data[o].name);
                    tennisStat.LoadDetailPlayer(url, function (result, err, refer) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        if(result) {
                            // Update player info
                            var sql = 'UPDATE `' + players.PlayerObject(null).table
                                + '` SET `tennis_stat_id_map`=' + result.tennis_stat_id_map
                                //+ ', `birth`="' + result.birth
                                //+ '",`gender`=' + result.gender
                                + ' WHERE `id`=' + refer.id;
                            /*result.sql = sql;
                             res.json(result);*/

                            console.log('"' + refer.name + '" is updated.')
                            players.PlayerModel.executeQuery(sql, function (data, err) {
                            });
                        } else {
                            console.log('"' + refer.name + '" not found.')
                        }

                    }, data[o]);
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
        var name_1 = req.query.name_1 || '';
        var name_2 = req.query.name_2 || '';

        if (name_1 == '') {
            res.json({
                'msg': 'Thieu tham so name_1'
            });
            return;
        }

        if (name_2 == '') {
            res.json({
                'msg': 'Thieu tham so name_2'
            });
            return;
        }
        if (player_1 == 0) {
            res.json({
                'msg': 'Thieu tham so player_1'
            });
            return;
        }
        if (player_2 == 0) {
            res.json({
                'msg': 'Thieu tham so player_2'
            });
            return;
        }
        if (map_player_1_id == 0) {
            res.json({
                'msg': 'Thieu tham so map_1'
            });
            return;
        }
        if (map_player_2_id == 0) {
            res.json({
                'msg': 'Thieu tham so map_2'
            });
            return;
        }
        // ---------------

        var url = 'http://tennis.matchstat.com/index.php?ControllerName=Compare&Id_Player1='
            + map_player_1_id + '&Id_Player2=' + map_player_2_id;
        console.log(url);

        tennisStat.LoadHeadToHead(url, function (head2head_data, err) {
            /*res.send(head2head_data);
             return;*/
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
                    console.log('histories_statistic_id: ' + histories_statistic_id);
                    // Add headToHead id for this data
                    for (var o in head2head_data) {
                        var param1 = player_1, param2 = player_2;
                        if (head2head_data[o].player_1 == name_1) {
                            param1 = player_1;
                            param2 = player_2;
                        } else {
                            param1 = player_2;
                            param2 = player_1;
                        }
                        // Delete key
                        delete head2head_data[o].player_1;
                        delete head2head_data[o].player_2;

                        head2head_data[o].head2head_id = histories_statistic_id;
                        head2head_data[o].winner = utils.getWinner(param1, param2, head2head_data[o].score);
                    }
                    // Add histories detail for this match
                    histories_detail.HistoryDetailModel.insertMulti(head2head_data, function (data, err) {
                        // Done
                        if (err) {
                            console.log(err);
                            res.send(head2head_data);
                        } else
                            res.send(head2head_data);
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
                            if (err) {
                                console.log(err);
                            }
                        })
                    })
                }
            });
            //res.json(head2head_data);
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
                        //+ ', `birth`="' + result.birth
                        //+ ', `gender`=' + result.gender
                        + '" WHERE `id`=' + player_id;
                    players.PlayerModel.executeQuery(sql, function (data, err) {
                        if (!err) {
                            console.log('Update player success');
                        }
                    });
                } else {
                    // Insert new player
                    var sql = "INSERT IGNORE INTO `" + players.PlayerObject().table
                        + "`(`name`,`tennis_stat_id_map`, `birth`)"
                        + " VALUE('" + player_name + "','" + result.tennis_stat_id_map + "','" + result.birth + "')";
                    players.PlayerModel.executeQuery(sql, function (data, err) {
                        if (!err) {
                            console.log('Add new player success');
                        }
                    });
                }
            });
            res.json(result);

        }, null);
    }

    // ---------------- Update player in Wiki
    self.getAllPlayerInfoOnWiki = function (req, res) {
        var con = '`refer` IS NULL OR `refer` = ""'; // No link to refer

        // Load list player
        players.PlayerModel.getList('`id`,`name`', con, null, 'all', function (data, err) {
            for (var o in data) {
                req.query.name = data[o].name;
                req.query.player_id = data[o].id;
                req.query.renderJson = false;
                // Crawl info
                self.getPlayerInfoOnWiki(req, res);
                //break;
            }
            res.json(err || data);
        })
    }

    self.getPlayerInfoOnWiki = function (req, res) {
        var url = 'http://en.wikipedia.org/wiki/',
            player = req.query.name,
            player_id = req.query.player_id,
            renderJson = req.query.renderJson || true;
        wiki.getPlayerInfo(url + player.replace(/\s/i, '_'), function (data, err) {
            // Update data
            var sql = "UPDATE `" + players.PlayerObject().table
                + "` SET `avatar`='" + data.avatar + "', `country`='" + data.country + "', `des`='" + data.des.replace(/['ˈ]/g, "\\'") + "' WHERE `id`=" + player_id;
            //res.send(sql); return;
            players.PlayerModel.executeQuery(sql, function (data, err) {
                if (err) {
                    console.log(err);
                }
                console.log(renderJson + ': option');
                if (!renderJson) {
                    return;
                }
                res.json(data);
            })
            //res.send(data);
        });

    }

    // ------------------------------

    self.getNews = function (req, res) {
        var start = req.query.start || 0,
            end = req.query.end || 100,
            url = 'http://www.tennis.com/more-subchannel-articles/breaking-news/' + start + '/' + end + '/';

        tennis_news.getTennisNews(url, function (data, err) {
            var result = [];
            // Revert data key
            if (data.length > 0) {
                for (var i = data.length - 1; i >= 0; i--) {
                    result.push(data[i]);
                }
            }
            news.NewsModel.insertMulti(result, function (result, err) {
                console.log(err || result);
            });
            res.json(data);
        });
        //news.NewsModel.getNews()
    }

    self.getVideo = function (req, res) {
        var url = 'https://www.youtube.com/results?search_sort=video_date_uploaded&search_query=tennis+highlight';
        tennis_video.getTFVideo(url, function (data, err) {
            var result = [];
            // Revert data key
            console.log('Length data: ' + data.length);
            if (data.length > 0) {
                for (var i = data.length - 1; i >= 0; i--) {
                    if (typeof data[i].video != 'undefined')
                        result.push(data[i]);
                }
            }
            video.VideoModel.insertMulti(result, function (result, err) {
                res.json(err || result);
            });
            //res.json(result);
        });
    }

    // ------------------
    self.getNewsForTag = function (req, res) {
        var url = 'http://www.tennis.com/more-subchannel-articles/breaking-news/0/200/';
        tennis_news.getTennisNews(url, function (data, err) {
            var result = [];
            // Revert data key
            if (data.length > 0) {
                for (var i = data.length - 1; i >= 0; i--) {
                    var obj = {};

                    obj['title'] = data[i].title;
                    obj['source'] = data[i].link;
                    obj['postedData'] = require('./../../utils/Utils').getDateDbString(new Date(Date.parse(data[i].posted_time)));
                    obj['authors'] = data[i].authors;
                    obj['content'] = data[i].content;

                    result.push(obj);
                }
            }
            newsTagMatch.NewsModel.insertMulti(result, function (result, err) {
                console.log(err || result);
            })
            res.json(result);
        }, ['authors']);
    }

    // ------------------------------- LOAD RANKING
    self.getRankOrAddNew = function (req, res) {
        //WTA http://www.wtatennis.com/singles-rankings
        //ATP http://www.atpworldtour.com/Rankings/Singles.aspx
        var type = req.query.type || 'atp',
            url = (type == 'atp' ? 'http://www.atpworldtour.com/Rankings/Singles.aspx' :
                'http://www.wtatennis.com/singles-rankings');

        /*var sql = "UPDATE `" + players.PlayerObject().table
         + "` SET `refer`='', `country`='', `rank`='' WHERE `name`='Andy Murray'";
         players.PlayerModel.executeQuery(sql, function (data, err) {
         res.json(err || data)
         });
         return;*/

        if (type == 'atp') {
            // Crawl player info
            /*var player = {
             name:'',
             refer:'http://www.atpworldtour.com/Tennis/Players/Top-Players/Pablo-Cuevas.aspx',
             rank: 4175,
             country: 'Czech Republic'
             };
             atpWorld.Profile(player.refer, function(result, err, player) {
             if(err) {
             console.log(err); return;
             }
             for(var i in result) {
             player[i] = result[i];
             }
             res.json(player);
             }, player);
             return;*/

            atpWorld.Rank(url, function (data, err, player_link) {

                // Re-crawl with other pages
                if (player_link) {
                    var timer = 15000; // 15 seconds
                    for (var i in player_link) {
                        setTimeout(function (obj) {
                            atpWorld.Rank(player_link[obj], function (data, err) {
                                // Update or crawl new player
                                if (!err) {
                                    for (var o in data) {
                                        var sql = "UPDATE `" + players.PlayerObject(null).table
                                            + "` SET `refer`='" + data[o].refer + "', `country`='" + data[o].country
                                            + "', `rank`='" + data[o].rank + "' WHERE `name`='" + data[o].name + "'";
                                        players.PlayerModel.executeQuery(sql, function (data, err, player) {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            }
                                            // Check row exist or not
                                            if (!data.affectedRows) { // Data not found
                                                // Crawl new data for this player
                                                atpWorld.Profile(player.refer, function (result, err, player) {
                                                    if (err) {
                                                        console.log(err);
                                                        return;
                                                    }
                                                    for (var i in result) {
                                                        player[i] = result[i];
                                                    }
                                                    players.PlayerModel.insertPlayer(player, function (data, err, refer) {
                                                        if (err) {
                                                            console.log(err);
                                                        } else {
                                                            console.log((new Date().toUTCString()) + ' Insert: ' +  refer.name);
                                                        }
                                                    }, player);
                                                }, player);
                                            } else {
                                                console.log((new Date().toUTCString()) + ' Update: ' + player.name);
                                            }

                                        }, data[o]);
                                    }
                                }
                            }, {});
                        }, timer * i, i);

                    }
                }

                // Update data
                if (!err) {
                    for (var o in data) {
                        var sql = "UPDATE `" + players.PlayerObject(null).table
                            + "` SET `refer`='" + data[o].refer + "', `country`='" + data[o].country
                            + "', `rank`='" + data[o].rank + "' WHERE `name`='" + data[o].name + "'";
                        players.PlayerModel.executeQuery(sql, function (data, err, player) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            // Check row exist or not
                            if (!data.affectedRows) { // Data not found
                                // Crawl new data for this player
                                atpWorld.Profile(player.refer, function (result, err, player) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    for (var i in result) {
                                        player[i] = result[i];
                                    }
                                    players.PlayerModel.insertPlayer(player, function (data, err, refer) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log((new Date().toUTCString()) + ' Insert: ' +  refer.name);
                                        }
                                    }, player);
                                }, player);
                            } else {
                                console.log((new Date().toUTCString()) + ' Update: ' + player.name);
                            }
                        }, data[o]);
                    }
                }
                res.json(data);
            }, {});
        } else { // WTA
            wtaWorld.Rank(url, function (data, err, refer) {
                //res.json(data);

                // Check has link continue crawl
                if (refer) {
                    var timer = 15000; // 15 seconds
                    for (var o in refer) {
                        setTimeout(function (obj) {
                            wtaWorld.Rank(refer[obj], function (data, err, refer) {
                                if (!err) {
                                    for (var o in data) {
                                        var sql = "UPDATE `" + players.PlayerObject(null).table
                                            + "` SET `refer`='" + data[o].refer + "', `country`='" + data[o].country
                                            + "', `rank`='" + data[o].rank + "' WHERE `name`='" + data[o].name + "'";
                                        players.PlayerModel.executeQuery(sql, function (data, err, player) {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            }
                                            // Check row exist or not
                                            if (!data.affectedRows) { // Data not found
                                                // Crawl new data for this player
                                                wtaWorld.Profile(player.refer, function (result, err, player) {
                                                    if (err) {
                                                        console.log(err);
                                                        return;
                                                    }
                                                    for (var i in result) {
                                                        player[i] = result[i];
                                                    }
                                                    players.PlayerModel.insertPlayer(player, function (data, err, player) {
                                                        if (err) {
                                                            console.log(err);
                                                        } else {
                                                            console.log((new Date().toUTCString()) + ' Insert: ' + player.name);
                                                        }
                                                    }, player);
                                                }, player);
                                            } else {
                                                console.log((new Date().toUTCString()) + ' Update: ' + player.name);
                                            }
                                        }, data[o]);
                                    }
                                }
                            }, {});
                        }, timer * o, o);
                    }
                }

                // Update data
                if (!err) {
                    for (var o in data) {
                        var sql = "UPDATE `" + players.PlayerObject(null).table
                            + "` SET `refer`='" + data[o].refer + "', `country`='" + data[o].country
                            + "', `rank`='" + data[o].rank + "' WHERE `name`='" + data[o].name + "'";
                        players.PlayerModel.executeQuery(sql, function (data, err, player) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            // Check row exist or not
                            if (!data.affectedRows) { // Data not found
                                // Crawl new data for this player
                                wtaWorld.Profile(player.refer, function (result, err, player) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    for (var i in result) {
                                        player[i] = result[i];
                                    }
                                    players.PlayerModel.insertPlayer(player, function (data, err, player) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log((new Date().toUTCString()) + ' Insert: ' + player.name);
                                        }
                                    }, player);
                                }, player);
                            } else {
                                console.log((new Date().toUTCString()) + ' Update: ' + player.name);
                            }
                        }, data[o]);
                    }
                }
                res.json(data);
            }, {});
        }
    }

    /**
     * Update some data for profile on ATP
     * @param req
     * @param res
     */
    self.getUpdateAtpProfile = function (req, res) {
        var type = req.query.type || 'atp';
        if (type == 'atp') {
            players.PlayerModel.getList('*', '`birth`="undefined" AND `refer` != "" AND `refer` IS NOT NULL', null, 'all', function (data, err) {
                for (var o in data) {
                    if (data[o].refer) {
                        atpWorld.Profile(data[o].refer, function (result, err, player) {
                            /*console.log('UPDATE `' + players.PlayerObject(null).table
                             + '` SET `birth`="' + result.birth + '" WHERE `id`=' + player.id);*/
                            players.PlayerModel.executeQuery('UPDATE `' + players.PlayerObject(null).table
                                + '` SET `birth`="' + result.birth + '" WHERE `id`=' + player.id, function (data, err) {
                                // Check update
                                if (err) {
                                    console.log(err);
                                }
                            })
                        }, data[o]);
                    }
                }
                res.json(err || data);
            });
        } else {
            res.json({msg: 'Do something for WTA'});
        }

    }

    self.Test = function(req, res) {
        res.json({
            name : 'binhnt',
            birth : '30/09/1986'
        });
    }
}

exports.Crawler = new Crawler();