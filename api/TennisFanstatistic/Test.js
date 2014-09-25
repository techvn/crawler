/**
 * Created by Administrator PC on 9/23/14.
 */
var crawler = require('./Crawler').Crawler,
    utils = require('./../../utils/Utils').Utils;
function Test() {
    var self = this;
    self.getCrawl = function(req, res) {
        crawler.Test(req, res);
    }

    self.getSendMail = function(req, res) {
        utils.sendMail(null);
        res.json( { send : 'testing ...'} );
    }
}
exports.Test = new Test();