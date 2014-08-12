//var util = require('./../../utils').Utils;

function Cnn() {
    var self = this;
    this.getCrawlCnn = function(req, res) {
        var url = req.query.url;
        
        if(url != null) {
            var Crawler = require('crawler').Crawler;
            var crawler = new Crawler({
                
            });
            crawler.queue([{
                'uri' : url,
                'callback': function(error, result, $) {
                    res.send(result.body);
                }
            }]);
        } else {
            res.send('crawl error!');
        }
    }

    // Test connect mysql

}

exports.Cnn = new Cnn();
