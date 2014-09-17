/**
 * Created by Administrator PC on 9/16/14.
 */
var matchObject = require('./../model/TF_Matches'),
    utils = require('./../utils/Utils').Utils,
    cheerio = require('cheerio');
function TennisNewsHtmlParse() {
    var self = this;
    self.getTennisNews = function(url, callback) {
        var crawler = utils.getCrawler(null);
        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    $ = cheerio.load(result.body);
                    var data = [];
                    var inc = 0;
                    $('.has-thumb').each(function(index) {
                        var obj = {};
                        obj.thumb = $(this).find('.thumbnail img').attr('src');
                        obj.title = $(this).find('h3').text().replace(/'/g, "\\'");
                        obj.posted_time = $(this).find('.dateline').text();
                        obj.brief = $(this).find('p').text().replace(/'/g, "\\'");
                        obj.link = 'http://www.tennis.com' + $(this).find('.thumbnail').attr('href');
                        obj.created_time = require('./../utils/Utils').getDateDbString();
                        // Get detail
                        console.log(obj.link);
                        self.getNewsDetail(obj.link, function(result, err) {
                            inc++;
                            data.push(result);
                        }, obj)
                    });

                    // Check load to the end data
                    var timer = setInterval(function() {
                        if(inc == $('.has-thumb').length) {
                            callback(data, null);
                        }
                    }, 250);

                    /*try {
                        callback(data, null);
                    } catch(e) {
                        callback(data, e);
                    }*/
                }
            }]);
    }

    self.getNewsDetail = function(url, callback, refer) {
        var crawler = utils.getCrawler(null);
        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    $ = cheerio.load(result.body);

                    // Get content here
                    refer.content = $('article.full').find('div.text').text().replace(/'/g, "\\'");

                    callback(refer, null);
                }
            }]);
    }
}
exports.TennisNewsHtmlParse = new TennisNewsHtmlParse();