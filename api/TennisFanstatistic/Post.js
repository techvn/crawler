/**
 * Created by Administrator PC on 9/14/14.
 */
var utils = require('./../../utils/Utils');

function Post() {
    var self = this;
    self.postAddVote = function (req, res) {
        // Util load form data
        utils.processRequest(req, function(data) {
            var result = {};
            // data
            result.result = true;
            result.message = 'Vote success';
            result.post = data;
            res.json(result);
        });
    }
}

exports.Post = new Post();