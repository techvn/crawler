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
        var youtubeObj = s || {}; //youTube.YouTube(s);
        if (!url.match(/youtube.com/)) {
            callback('', 'Url not validate!');
            return;
        }

        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    try {
                        $ = cheerio.load(result.body);
                        youtubeObj.content = $('#eow-description').html();
                        callback(youtubeObj, null);
                    } catch (e) {
                        console.log(e);
                        callback(youtubeObj, e);
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
        crawler.queue([
            {
                'uri': link,
                'callback': function (error, result, $) {
                    $ = cheerio.load(result.body);
                    var data = {};

                    $('#results div.yt-lockup').each(function (index) {
                        var obj = {};//youTube.YouTube(null);
                        data[index] = {};
                        /*obj.img = (typeof $(this).find('img').attr('data-thumb') != 'undefined') ?
                            $(this).find('img').attr('data-thumb') : $(this).find('img').attr('src');*/
                        obj.title = $(this).find('h3.yt-lockup-title').text();
                        obj.author = $(this).find('.yt-lockup-meta-info b').text();
                        obj.brief = $(this).find('div.yt-lockup-description').html();
                        obj.publish = $(this).find('li').eq(1).text();
                        obj.viewed = $(this).find('li').eq(2).text().replace(/[a-zA-Z\s]/g, '');
                        obj.link = 'https://youtube.com' + $(this).find('h3.yt-lockup-title').find('a').attr('href');
                        obj.youtubeId = $(this).find('h3.yt-lockup-title').find('a').attr('href').split('=')[1];

                        data[index] = obj;
                    });

                    callback(data);
                }
            }
        ]);
    }

    self.ParseDetailApi = function (link, callback, obj) {
        var crawler = utils.getCrawler(),
            result = obj || {};
        crawler.queue([
            {
                uri: link,
                callback: function (err, __result, $) {
                    try {
                        var data = JSON.parse(__result.body);
                        //result[data.data.id] = data.data;
                        var dateString = data.data.updated.substr(0, 19).replace('T', ' ');
                        result.publish = dateString;
                        result.content = data.data.description;
                        result.thumb = data.data.thumbnail.sqDefault;
                        result.img = data.data.thumbnail.hqDefault;
                        result.duration = data.data.duration;
                        result.viewed = data.data.viewed;
                        result.likeCount = data.data.likeCount;
                    } catch (e) {
                        var d = new Date();
                        result[d.getTime()] = e;
                    }
                    callback(result);
                }
            }
        ]);
    }
}

exports.YouTubeHtmlParse = new YouTubeHtmlParse();