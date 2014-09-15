/**
 * Created by Administrator PC on 9/14/14.
 */
var utils = require('./../../utils/Utils').Utils,
    voteModel = require('./../../model/TF_Votes'),
    playerModel = require('./../../model/TF_Player'),
    matchModel = require('./../../model/TF_Matches'),
    historyModel = require('./../../model/TF_Histories'),
    historyDetailModel = require('./../../model/TF_HistoriesDetail');
function Get() {
    var self = this;

    // Get player detail
    // Params: id
    self.getPlayerDetail = function (req, res) {
        // Load player
        var player_id = req.query.id || 0;
        playerModel.PlayerModel.getDetail('id,name,avatar,birth,country,des', '`id`=' + player_id, function (data, err) {
            var result = {};
            for (var o in data) {
                result = data[o];
                break;
            }
            result.matches = [];
            var players = [], load_user = false;
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
                    }
                    var timer = setTimeout(function () {
                        if (inc == Object.keys(data).length & load_user) {
                            // Response data

                            if (result.matches.length > 0) {
                                for (var o in result.matches) {
                                    if (typeof players[result.matches[o].player_with] !== 'undefined') {
                                        result.matches[o].player_with = players[result.matches[o].player_with];
                                        /*result.matches[o].winner = utils.getWinner(player_id, result.matches[o].player_with, result.matches[o].score);
                                         var sql = 'UPDATE `' + historyDetailModel.HistoryDetailObject().table + '` SET `winner`=' + result.matches[o].winner + ' WHERE `id`=' + result.matches[o].id;
                                         historyDetailModel.HistoryDetailModel.executeQuery(sql, function(data, err) { });*/
                                        result.matches[o].winner = (result.matches[o].winner = player_id ? true : false);
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

        var result = playerModel.PlayerObject({'field': {
                'name': 'Roger Federer',
                'avatar': '',
                'birth': '8 August 1981',
                'country': 'Switzerland',
                'des': 'Federer has won the ATPWorldTour.com Fans\' Favourite Award a record eleven times straight (2003–2013) and the Stefan Edberg Sportsmanship Award (voted for by the players) a record nine times (2004–2009, 2011–2013)'
            }
            }
        ).field;
        result.matches = [
            {
                'time': '36/2014',
                'player_with': 'Rafael Nadal',
                'surface': 'hard',
                'tournament': 'US Open',
                'round': '342',
                'score': '4-6 7-6(4) 3-6',
                'win': false
            },
            {
                'time': '32/2010',
                'player_with': 'Steffi Graf',
                'surface': 'hard',
                'tournament': 'Australia Open',
                'round': '342',
                'score': '6-2 7-6(3)',
                'win': true
            }
        ]
        res.json(result);
    }

    /**
     * Load today's match (in week)
     * @param req
     * @param res
     */
    self.getMatchToday = function (req, res) {

        var limit = req.query.limit || '';
        // Load matches
        var matches = [];
        var players = [];
        matchModel.MatchModel.getList('`id`,`year`,`tournament`,`player_1`,`player_2`', null, 'id ASC', limit, function (list_matches, err) {
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
                res.json(list_matches);
            }
        });
        return;

        var result = [
            {
                'id': 1,
                'player_1': {
                    id: 1,
                    name: 'Federer',
                    avatar: 'Link avatar',
                    win: 15,
                    vote: 20
                },
                'player_2': {
                    id: 2,
                    name: 'Rafael Nadal',
                    avatar: 'Link avatar',
                    win: 15,
                    vote: 20
                },
                'year': '35/2014',
                'tournament': 'Davis Cup, ISR-ARG',
                'voted': true,
                'vote_choose': 1
            },
            {
                'id': 2,
                'player_1': {
                    id: 8,
                    name: 'Betsy Abbas',
                    avatar: 'Link avatar',
                    win: 55,
                    vote: 22
                },
                'player_2': {
                    id: 5,
                    name: 'Ivana Abramović',
                    avatar: 'Link avatar',
                    win: 48,
                    vote: 17
                },
                'year': '35/2014',
                'tournament': 'US Open',
                'voted': false,
                'vote_choose': 0
            }
        ];
        res.json(result);
    }

    /**
     * Load detail for head-to-head
     * @param rea
     * @param res
     */
        self.getHeadToHead = function (req, res) {
        // Get match detail by match id
        var match_id = req.query.id || 0;
        matchModel.MatchModel.getList('`id`,`year`,`tournament`,`player_1`,`player_2`', '`id`=' + match_id, 'id ASC', '1', function (list_matches, err) {
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
                var players = [];
                playerModel.PlayerModel.getList('`id`,`name`,`avatar`,`win`,`des`', '`id` IN (' + player_id + ')', null, 'all', function (list_user, err) {
                    if (err) {
                        res.json(err);
                        return;
                    }
                    if (list_user.length > 0) {
                        for (var o in list_user) {
                            // Load vote num here
                            list_user[o].vote = 0;
                            
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

                            //res.send(sql); return;

                            historyModel.HistoriesModel.executeQuery(sql, function (data, err, refer) {
                                if (err) {
                                    res.json(list_matches);
                                    return;
                                }
                                for(var _o in data) {
                                    data[_o].player_with = (data[_o].winner == data[_o].player_1 ? players[data[_o].player_2].name : players[data[_o].player_1].name);
                                    data[_o].winner = players[data[_o].winner].name;
                                    delete data[_o].player_1;
                                    delete data[_o].player_2;
                                    list_matches[o].matches.push(data[_o]);
                                }
                                res.json(list_matches);
                            }, o);
                        }
                    } else
                        res.json(list_matches);
                });
            } else {
                res.json(list_matches);
            }
        });
        return;

        var result = {
            'id': 1,
            'year': '35/2014',
            'tournament': 'US Open',
            'voted': true,
            'vote_choose': 1,
            'player_1': {
                id: 1,
                name: 'Federer',
                avatar: 'Link avatar',
                win: 15,
                vote: 20,
                des: 'More info about player'
            },
            'player_2': {
                id: 2,
                name: 'Rafael Nadal',
                avatar: 'Link avatar',
                win: 15,
                vote: 20,
                des: 'More info about player'
            },
            'matches': [
                {
                    'time': '35/2012',
                    'surface': 'hard',
                    'tournament': 'US Ppen',
                    'round': '342',
                    'score': '4-6 7-6(4) 3-6',
                    'win': 'Roger Federer'
                }
            ]
        }
        res.json(result);
    }

    // News --------------
    self.getListNews = function (req, res) {
        var result = [
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
        res.json(result);
    }

    self.getNewDetail = function (req, res) {
        var result = {
            id: 1,
            title: 'Title of news',
            brief: 'Brief for news',
            link: 'Link detail of news if don\'t have crawled content',
            'thumb': 'Link to thumb image',
            content: 'Full description text hear'
        };
        res.json(result);
    }


    // Video -------------
    self.getListVideo = function (req, res) {
        var result = [
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
        res.json(result);
    }
    self.getVideoDetail = function (req, res) {
        var result = {
            id: 1,
            title: 'Title of video',
            brief: 'Brief for video',
            link: 'Link detail of news if don\'t have crawled content',
            thumb: 'Link to thumb image',
            content: 'Full description text hear',
            video: 'iframe embed or id of youtube link'
        };
        res.json(result);
    }


    // Check user voted or not by user_id, match_id and player
    self.getCheckUserVote = function (req, res) {
        var result = {};
        result['voted'] = true;
        result['vote_player'] = 1;

        res.json(result);
    }

}

exports.Get = new Get();