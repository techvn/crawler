/**
 * Created by Administrator PC on 8/13/14.
 */
var nyTimesModel = require('./../model/NyTimes'),
    utils = require('./../utils/Utils').Utils,
    cheerio = require('cheerio');

var NyTimesHtmlParse = function () {
    var self = this;

    /**
     * Crawl news
     * @param url
     * @param callback
     * @param s
     * @constructor
     */
    self.NewsScraper = function (url, callback, s) {

        var crawler = utils.getCrawler();
        nyTimesModel = nyTimesModel.Cnn(null);        
        if(!url.match(/http:\/\/nytimes.com\/(\d+)/)) {
            callback('', 'Url not validate!'); return;
        }

        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    try {
                        $ = cheerio.load(result.body);
                        nyTimesModel.title = $("#story-header .story-heading")[0].textContent;
                        nyTimesModel.brief = s.brief || '';
                        nyTimesModel.link = url;

                        var nauthor = $(".byline-dateline .byline").length;
                        var author = $(".byline-dateline .byline .byline-author")[0].textContent;
                        if(author > 1) {
                            author += " and ";
                            for(var i = 1; i < nauthor; i++){
                                author += $(".byline-dateline .byline .byline-author")[i].textContent;
                            }                        
                        }
                        nyTimesModel.author = author;
                        
                        var body = $("#story .story-body-text")[0].textContent;
                        var nbody = $("#story .story-body-text").length;
                        if(nbody > 1){
                            for(var i = 1; i < nbody; i++){
                                body += $("#story .story-body-text")[i].textContent;
                            }
                        }

                        nyTimesModel.content = body;
                        nyTimesModel.img = $(".interactive-image img")[0].src;;
                        nyTimesModel.publish = Date($(".byline-dateline .dateline")[0].textContent);;


                        callback(nyTimesModel, null);

                    } catch (e) {
                        console.log(e);
                        callback(nyTimesModel, e);
                    }
                }
            }
        ]);
    }

    /**
     * Crawl link news in category link
     * @param link
     * @param callback
     * @constructor
     */
    self.CategoryScraper = function (link, callback) {
        var crawler = utils.getCrawler();
        nyTimesModel = nyTimesModel.Cnn(null);
        crawler.queue([
            {
                'uri': link,
                'callback': function (error, result, $) {
                    var links = [];
                    var links_str = '';
                    try {
                        $ = cheerio.load(result.body);
                        var main = $('#main').find('a');
                        $(main).each(function (index) {
                            if (links_str.indexOf($(this).attr('href')) >= 0 || $(this).attr('href').indexOf('http') >= 0) {
                                return;
                            }
                            links_str += $(this).attr('href') + ' ';
                            links[index] = nyTimesModel.domain + $(this).attr('href');
                        });
                        callback(links);
                    } catch (e) {
                        console.log(e);
                        callback(links, e);
                    }
                }
            }
        ]);
    }
}
exports.NyTimesHtmlParse = new NyTimesHtmlParse();
