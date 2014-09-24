/**
 * Created by Administrator PC on 9/14/14.
 */
var utils = require('./../../utils/Utils'),
    voteModel = require('./../../model/TF_Votes'),
    matches = require('./../../model/TF_Matches'),
    users = require('./../../model/TF_Users'),
    usersFollow = require('./../../model/TF_UsersFollow');

function Post() {
    var self = this;
    self.postAddVote = function (req, res) {

        // Util load form data
        utils.processRequest(req, function (data) {
            var vote = {};
            // data
            vote.user_id = data['user_id'];
            vote.match_id = data['match_id'];
            vote.player_id = data['player_id'];

            voteModel.VotesModel.insertSingle(vote, function (__data, err) {
                if (err) {
                    err.result = false;
                    res.json(err);
                    return;
                }
                // Update count vote for match
                matches.MatchModel.getDetail('*', '`id`=' + vote.match_id, function (result, err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    if (result.length > 0) {
                        for (var o in result) {
                            result = result[o];
                            break;
                        }
                        var sql_update = 'UPDATE `' + matches.MatchObject().table + '` SET ';
                        if (result['player_1'] == vote.player_id) { // Increase 1 for total_voted_player_1
                            sql_update += '`total_voted_player_1`=' + (result['total_voted_player_1'] + 1)
                        } else { // Increase 1 for total_voted_player_2
                            sql_update += '`total_voted_player_2`=' + (result['total_voted_player_2'] + 1)
                        }
                        sql_update += ' WHERE `id`=' + vote.match_id;
                        matches.MatchModel.executeQuery(sql_update, function (data, err) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            console.log('Update success');
                        });
                    }
                });
                res.json({
                    result: true,
                    message: 'Vote success',
                    data: data
                })
            });
            /*vote.result = true;
             vote.message = 'Vote success';
             vote.post = data;
             res.json(vote);*/
        });
    }

    /**
     * Follow player
     * @param req
     * @param res
     */
    self.postFollow = function (req, res) {
        utils.processRequest(req, function (data) {
            var device_id = data['device_id'] || '',
                player_id = data['player_id'] || 0,
                email = data['email'] || '',
                receive_news = data['receive_news'] || 0;
            // ACTION
            /*1. check device_id has been exist
             2. Inser or update new device with properties
             3. Add new row for follow player*/
            users.UsersModel.getDetail('`id`', '`device_id`="' + device_id + '"', function (result, err) {
                if (err) {
                    res.json(err);
                    return;
                }

                if (result.length > 0) {
                    for (var o in result) {
                        result = result[o];
                    }
                    // Update info
                    users.UsersModel.executeQuery('UPDATE `` SET `emai`="' + email + '", `receive_news`' + receive_news +
                        ' WHERE `id`=' + result.id, function (result, data) {

                    });
                    // Add new follow
                    var uf = {user_id: result.id, player_id: player_id };
                    usersFollow.UsersFollowModel.insertSingle(uf, function (data, err) {
                        // Log something
                        var value = {};
                        if (err) {
                            value = { result: 0, message: 'Insert new follow fail' };
                            console.log(err);
                        } else {
                            value = { result: 1, message: 'Insert new follow success' };
                        }
                        // Response data
                        res.json(value);
                    });
                } else { // Insert new device
                    var uObj = { device_id: device_id, reg_time: utils.getDateDbString(), email: email, receive_news: receive_news};
                    users.UsersModel.insertSingle(uObj, function (data, err) {
                        if (err) {
                            console.log(err);
                            res.json({ result: 0, message: 'Can not insert this user' });
                        } else {
                            // Insert user success, then insert new follow
                            usersFollow.UsersFollowModel.insertSingle({user_id: data.insertId, player_id: player_id },
                                function (data, err) {
                                    var value = value = { result: 1, message: 'Follow this player success' };
                                    if (err) {
                                        console.log(err);
                                        value = value = { result: 0, message: 'Follow this player fail' };
                                    }
                                    // Response data
                                    res.json(value);
                                });
                        }
                    });
                }
            });
        });

    }
    /**
     * Un follow player
     * @param req
     * @param res
     */
    self.postUnFollow = function (req, res) {
        utils.processRequest(req, function (data) {
            var device_id = data['device_id'] || '',
                user_id = data['user_id'] || 0,
                player_id = data['player_id'] || 0;

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
                    usersFollow.UsersFollowModel.executeQuery("DELETE * FROM `" + usersFollow.UsersFollowObject(null).table
                        + "` WHERE `user_id`=" + data.id + " AND `player_id`=" + player_id
                        , function (data, err) {
                            if (err) {
                                console.log(err);
                                res.json({result: 0, message: 'Un-follow this player fail'});
                                return;
                            }
                            res.json({result: 1, message: 'Un-follow this player success'});
                        });
                });
            }
        });

    }
}

exports.Post = new Post();