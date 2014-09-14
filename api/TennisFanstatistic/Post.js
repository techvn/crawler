/**
 * Created by Administrator PC on 9/14/14.
 */
var utils = require('./../../utils/Utils');

function Post() {
    var self = this;
    self.postAddVote = function (req, res) {
        // Util load form data
        utils.processRequest(req, function(data) {
            // data
            res.json(data);
        });
    }
}

exports.Post = new Post();