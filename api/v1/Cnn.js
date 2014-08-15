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
                    var author = $("#cnnContentContainer .cnn_stryathrtmp .cnnByline strong")[0].textContent;
                    var date = Date($("#cnnContentContainer .cnn_stryathrtmp .cnn_strytmstmp")[0].textContent);
                    var body = $("#cnnContentContainer p")
                    var image = $("#cnnContentContainer .cnn_stryimg640captioned img").attr("src")
                    
                    res.json({
                        title: title,
                        author: author,
                        date: date,
                        body: $('<div>').append(body).html(),
                        image: image
                    });
                }
            }]);
        } else {
            res.send('crawl error!');
        }
    }

    // Test connect mysql

}

exports.Cnn = new Cnn();
