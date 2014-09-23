/**
 * Created by Administrator PC on 9/23/14.
 */
var crawler = require('./Crawler').Crawler;
function Test() {
    var self = this;
    self.getCrawl = function(req, res) {
        crawler.Test(req, res);
    }
}
exports.Test = new Test();