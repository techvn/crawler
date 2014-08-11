//var util = require('./../../utils').Utils;

function Cnn() {
    var self = this;
    this.getCrawlCnn = function(req, res) {
        var url = req.query.url;
        if(url != null) {
            var Crawler = require('crawler').Crawler;
            self._crawler = new Crawler({
                'uri' : url,
                "timeout" : 30000, //30s
                "jQuery" : false,
                'callback': function(error, result, $) {
                    res.send(result);
                }
            });
        } else {
            res.send('crawl error!');
        }
    }
}

exports.Cnn = new Cnn();