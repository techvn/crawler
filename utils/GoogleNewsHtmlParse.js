/**
 * Created by Administrator PC on 8/20/14.
 */
var googleNews = require('./../model/GoogleNews'),
    utils = require('./../utils/Utils').Utils,
    cheerio = require('cheerio'),
    xmlParse = require('jsonml').parse;

var GoogleNewsHtmlParse = function () {
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
        googleNews = googleNews.GoogleNews(null);
        if(!url.match(/news.google.com/)) {
            callback('', 'Url not validate!'); return;
        }

        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    try {
                        $ = cheerio.load(result.body);


                        callback(googleNews, null);

                    } catch (e) {
                        console.log(e);
                        callback(googleNews, e);
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
        googleNews = googleNews.GoogleNews(null);
        crawler.queue([
            {
                'uri': link,
                'callback': function (error, result, $) {
                    // Read rss data
                    var jsonXml = xmlParse(result.body);
                    var result = [];
                    for(var i = 10; i < jsonXml[2].length; i++) {
                        result[i - 10] = jsonXml[2][i];
                    }

                    var data = {};
                    var inc = 0;
                    for(var i = 0; i < result.length; i++) {
                        if(result[i].length <= 3 ) { continue; }
                        data[inc] = {};
                        for(var j = 1; j < result[i].length; j++) {
                            var value = result[i][j][1];
                            if(result[i][j][0] == 'link') {
                                value = result[i][j][1].split(/&url=/)[1];
                            }
                            if(result[i][j][0] == 'description') {
                                $ = cheerio.load(result[i][j][1]);
                                value = $('div.lh font').eq(2).text();
                                data[inc]['author'] = $('div.lh font').eq(1).text();
                                data[inc]['img'] = (typeof $('table img').attr('src') != 'undefined'
                                    ? $('table img').attr('src') : "");
                            }
                            data[inc][result[i][j][0]] = value;
                        }
                        inc++;
                    }

                    callback(data);
                }
            }
        ]);
    }
}

exports.GoogleNewsHtmlParse = new GoogleNewsHtmlParse();