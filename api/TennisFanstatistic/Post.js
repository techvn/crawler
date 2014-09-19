/**
 * Created by Administrator PC on 9/14/14.
 */
var utils = require('./../../utils/Utils'),
    voteModel = require('./../../model/TF_Votes'),
    matches = require('./../../model/TF_Matches');

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
}

exports.Post = new Post();