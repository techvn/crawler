//var util = require('./../../utils').Utils;
//URL: http://www.nytimes.com/2014/08/12/world/asia/killings-rise-in-karachi-as-taliban-target-police.html?hp&action=click&pgtype=Homepage&version=HpSum&module=second-column-region&region=top-news&WT.nav=top-news&_r=0
function nytimes() {
    var self = this;
    this.getCrawlNytimes = function(req, res) {
        var url = req.query.url;
        
        if(url != null) {
            var Crawler = require('crawler').Crawler;
            var crawler = new Crawler({
                
            });
            crawler.queue([{
                'uri' : url,
                'callback': function(error, result, $) {
                    var title = $("#story-header .story-heading")[0].textContent
                    
                    
                    var nauthor = $(".byline-dateline .byline").length;
                    var author = $(".byline-dateline .byline .byline-author")[0].textContent;
                    if(author > 1) {
                        author += " and ";
                        for(var i = 1; i < nauthor; i++){
                            author += $(".byline-dateline .byline .byline-author")[i].textContent;
                        }                        
                    }

                    var date = Date($(".byline-dateline .dateline")[0].textContent);

                    var body = $("#story .story-body-text")[0].textContent;
                    var nbody = $("#story .story-body-text").length;
                    if(nbody > 1){
                        for(var i = 1; i < nbody; i++){
                            body += $("#story .story-body-text")[i].textContent;
                        }
                    }

                   var image = $(".interactive-image img")[0].src;

                    res.json({
                        "title": title,
                        "author": author,
                        "date": date,
                        "body": body,
                        "imageURL": image
                    });
                }
            }]);
        } else {
            res.send('crawl error!');
        }
    }

    // Test connect mysql

}

exports.Nytimes = new nytimes();
