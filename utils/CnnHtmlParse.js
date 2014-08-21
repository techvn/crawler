/**
 * Created by Administrator PC on 8/13/14.
 */
var cnnModel = require('./../model/Cnn'),
    utils = require('./../utils/Utils').Utils,
    cheerio = require('cheerio');

var CnnHtmlParse = function () {
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
        cnnModel = cnnModel.Cnn(null);
        if(!url.match(/http:\/\/edition.cnn.com\/(\d+)/)) {
            callback('', 'Url not validate!'); return;
        }

        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    try {
                        $ = cheerio.load(result.body);
                        cnnModel.title = $('#cnnContentContainer').find('h1').text();
                        cnnModel.brief = s.brief || '';
                        cnnModel.link = url;
                        if ($('.cnn_html_slideshow').length > 0) {
                            // Multi images
                            $('.cnn_html_slideshow').find('img').each(function (index) {
                                cnnModel.img[index] = $(this).attr('src');
                            });
                        } else {
                            // Check CVPOptions
                            var thumb = '';
                            $('script').each(function (index) {
                                try {
                                    if ($(this).html().indexOf('var CVPOptions') > 0) {
                                        thumb = $(this).html().substr($(this).html().indexOf("thumb: '"));
                                        thumb = thumb.substring(8, thumb.indexOf("',"));
                                    }
                                } catch (e) {
                                    console.log(e);
                                }
                            });
                            if (thumb != '') {
                                cnnModel.img = s.img.length > 0 ? s.img : [thumb];
                            } else {
                                cnnModel.img = s.img.length > 0 ? s.img : [$('.cnn_strycntntlft').find('img').first().attr('src')];
                            }
                        }

                        $('.cnn_strycntntlft').find('script').remove();
                        var des = $('.cnn_strycntntlft').html();
                        try {
                            var start = des.indexOf('<div class="cnn_strylftcntnt">');
                            var end = des.indexOf('<p class="cnn_strycbftrtxt">');
                            des = des.substring(start, end);
                        } catch (e) {
                            console.log(e);
                        }
                        cnnModel.content = des.replace(/<(?:.|\n)*?>/gm, ''); // Remove all html tag

                        var publish = '';
                        if ($('div.cnn_strytmstmp').length > 0) {
                            publish = $('div.cnn_strytmstmp').html();
                        }
                        cnnModel.publish = publish || cnnModel.publish;
                        cnnModel.author = $('div.cnn_stryathrtmp').find('strong').html() || cnnModel.author;

                        callback(cnnModel, null);

                    } catch (e) {
                        console.log(e);
                        callback(cnnModel, e);
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
        cnnModel = cnnModel.Cnn(null);
        crawler.queue([
            {
                'uri': link,
                'callback': function (error, result, $) {
                    var links = [];
                    var links_str = '';
                    try {
                        $ = cheerio.load(result.body);
                        var main = $('#cnn_maintopt1').find('a');
                        $(main).each(function (index) {
                            if (links_str.indexOf($(this).attr('href')) >= 0 || $(this).attr('href').indexOf('http') >= 0) {
                                return;
                            }
                            links_str += $(this).attr('href') + ' ';
                            links[index] = cnnModel.domain + $(this).attr('href');
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
exports.CnnHtmlParse = new CnnHtmlParse();