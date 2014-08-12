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
                    var title = $("#cnnContentContainer h1")[0].textContent;
                    var authpr = $("#cnnContentContainer .cnn_stryathrtmp .cnnByline strong")[0].textContent;
                    var date = Date($("#cnnContentContainer .cnn_stryathrtmp .cnn_strytmstmp")[0].textContent);
                    var body = $("#cnnContentContainer p") 
                    var image = $("#cnnContentContainer .cnnArticleGalleryPhotoContainer") 
                    res.send(result.body);
                }
            }]);
        } else {
            res.send('crawl error!');
        }
    }
}

exports.Cnn = new Cnn();
