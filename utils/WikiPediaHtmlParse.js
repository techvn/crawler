/**
 * Created by Administrator PC on 9/16/14.
 */
var matchObject = require('./../model/TF_Matches'),
    utils = require('./../utils/Utils').Utils,
    cheerio = require('cheerio');
function WikiPediaHtmlParse() {
    var self = this;
    self.getPlayerInfo = function(url, callback) {
        var crawler = utils.getCrawler(null);
        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    $ = cheerio.load(result.body);
                    var mainObj = $('#mw-content-text').find('table.infobox');
                    var data = {};
                    data.avatar = 'http:' + $(mainObj).find('img').attr('src');
                    $(mainObj).find('tr').each(function(index) {
                        if($(this).find('th').text().replace(/\s/i, '').toLowerCase() == 'country') {
                            data.country = $(this).find('td').text().trim();
                            return false;
                        }
                    });
                    // Find description
                    var des = $(mainObj).next();
                    $(des).find('sup').remove();
                    data.des = $(des).text();

                    try {
                        callback(data, null);
                    } catch(e) {
                        callback(data, e);
                    }
                }
            }]);
    }
}

exports.WikiPediaHtmlParse = new WikiPediaHtmlParse();