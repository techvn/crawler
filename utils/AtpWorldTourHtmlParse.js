/**
 * Created by Administrator PC on 9/21/14.
 */
var utils = require('./../utils/Utils').Utils,
    cheerio = require('cheerio'),
    domain = 'http://www.atpworldtour.com';

function AtpWorldTourHtmlParse() {
    var self = this;
    self.Rank = function (url, callback, refer) {
        var crawler = utils.getCrawler(null);
        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    var player = [],
                        country = {};

                    $ = cheerio.load(result.body);
                    $('#singlesCountries option').each(function (index) {
                        country[$(this).val().trim()] = $(this).text();
                    });
                    // Find player
                    $('table.bioTableAlt tr').each(function (index) {
                        if (index == 0) {
                            return;
                        } // Continue to next row
                        player[index] = {};
                        player[index].refer = domain + $(this).find('td:nth-child(1)').find('a').attr('href');
                        var __name = $(this).find('td:nth-child(1)').find('a').text().split(/,/);
                        var str_name = '', space = '';
                        for (var i = __name.length - 1; i >= 0; i--) {
                            str_name += space + __name[i].trim();
                            space = ' ';
                        }
                        player[index].name = str_name.trim();
                        // Remove un-use
                        $(this).find('td:nth-child(1)').find('a').remove();
                        $(this).find('td:nth-child(1)').find('span').remove();
                        var key = $(this).find('td:nth-child(1)').text().replace(/[()]/g, '').trim();
                        player[index].country = (country[key] != undefined ? country[key] : key);
                        player[index].rank = $(this).find('td:nth-child(2)').find('a').text().replace(/[,\.]/g, '');
                    });

                    var datetime = new Date(),
                        date = (datetime.getDate() + 1) < 10 ? '0' + (datetime.getDate() + 1) : datetime.getDate() + 1,
                        month = datetime.getMonth() + 1 < 10 ? '0' + (datetime.getMonth() + 1) : datetime.getMonth() + 1,
                        year = datetime.getFullYear(),
                        link = 'http://www.atpworldtour.com/Rankings/Singles.aspx?d='
                            + (date +'.' + month +'.'  + year) + '&r=';
                    $('select#singlesStandings option').each(function(index) {
                        refer[index] = link + $(this).val();
                    });

                    callback(player, null, refer);
                }
            }
        ]);
    }

    /**
     * Crawl player info
     * @param url detail link want to crawl in atpworldtour.com
     * @param callback [player, err, refer]
     * @param refer object refer or something we want re-use
     * @constructor
     */
    self.Profile = function (url, callback, refer) {
        var crawler = utils.getCrawler(null);
        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    $ = cheerio.load(result.body);
                    var player = {};
                    player.gender = 1;
                    player.avatar = domain + $('#playerBioHeadShot img').attr('src');
                    try {
                        // Remove some link in profile
                        player.des = $('#personal').html().replace(/'/g, "\\'");
                        if($('#playerBioInfoList li:nth-child(1)').text().indexOf('Age') > -1) {
                            player.birth = self.convertBirth($('#playerBioInfoList li:nth-child(1)').text().match(/\((.*?)\)/)[1]);
                        } else
                            player.birth = self.convertBirth($('#playerBioInfoList li:nth-child(2)').text().match(/\((.*?)\)/)[1]);
                    } catch (e) {
                        console.log(e);
                    }

                    callback(player, null, refer);
                }
            }
        ]);
    }

    self.convertBirth = function (str) {
        var month = {
            '01': 'Jan',
            '02': 'Feb',
            '03': 'Mar',
            '04': 'Apr',
            '05': 'May',
            '06': 'Jun',
            '07': 'Jul',
            '08': 'Aug',
            '09': 'Sep',
            '10': 'Oct',
            '11': 'Nov',
            '12': 'Dec'
        }
        str = str.split(/\./);
        if(month[str[1]] != undefined) {
            str[1] = month[str[1]];
        }
        return str.join('-');
    }
}

exports.AtpWorldTourHtmlParse = new AtpWorldTourHtmlParse();