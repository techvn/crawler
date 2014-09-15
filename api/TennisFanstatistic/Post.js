/**
 * Created by Administrator PC on 9/14/14.
 */
var utils = require('./../../utils/Utils'),
    voteModel = require('./../../model/TF_Votes');

function Post() {
    var self = this;
    self.postAddVote = function (req, res) {

        // Util load form data
        utils.processRequest(req, function(data) {
            var vote = {};
            // data
            vote.user_id = data['user_id'];
            vote.match_id = data['match_id'];
            vote.player_id = data['player_id'];

            voteModel.VotesModel.insertSingle(vote, function(data, err) {
                if(err) {
                    err.result = false;
                    res.json(err); return;
                }
                res.json({
                    result: true,
                    message: 'Vote success'
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