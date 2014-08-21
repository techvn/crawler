/**
 * Created by Administrator PC on 8/20/14.
 */
var youTube = require('./../model/YouTube'),
    utils = require('./../utils/Utils').Utils,
    cheerio = require('cheerio');

var YouTubeHtmlParse = function () {
    var self = this;

    /**
     * Crawl news
     * @param url
     * @param callback
     * @param s
     * @constructor
     */
    self.DetailScraper = function (url, callback, s) {

        var crawler = utils.getCrawler();
        youTube = youTube.YouTube(null);
        if(!url.match(/youtube.com/)) {
            callback('', 'Url not validate!'); return;
        }

        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    try {
                        $ = cheerio.load(result.body);


                        callback(youTube, null);

                    } catch (e) {
                        console.log(e);
                        callback(youTube, e);
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
        youTube = youTube.YouTube(null);
        crawler.queue([
            {
                'uri': link,
                'callback': function (error, result, $) {

                }
            }
        ]);
    }
}

exports.YouTubeHtmlParse = new YouTubeHtmlParse();