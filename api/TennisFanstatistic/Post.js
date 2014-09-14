/**
 * Created by Administrator PC on 9/14/14.
 */

function Post() {
    var self = this;
    self.postAddVote = function(req, res) {
        console.log(req.query);

        var result = {'result' : true, 'message' : 'Vote success'};

        res.json(result);
    }
}

exports.Post = new Post();