/**
 * Created by Administrator PC on 9/14/14.
 */
var utils = require('./../../utils/Utils').Utils,
    voteModel = require('./../../model/TF_Votes'),
    playerModel = require('./../../model/TF_Player'),
    matchModel = require('./../../model/TF_Matches'),
    historyModel = require('./../../model/TF_Histories'),
    historyDetailModel = require('./../../model/TF_HistoriesDetail');
function Data() {
    var self = this;

    self.getPlayer = function(req, res) {
        res.json(playerModel.PlayerObject());
    }
}

exports.Data = new Data();