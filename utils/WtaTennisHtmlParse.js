/**
 * Created by Administrator PC on 9/21/14.
 */
var utils = require('./../utils/Utils').Utils,
    cheerio = require('cheerio'),
    domain = 'http://www.wtatennis.com';

function WtaTennisHtmlParse() {
    var self = this;
    self.Rank = function (url, callback, topLink) {
        var crawler = utils.getCrawler(null);
        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    $ = cheerio.load(result.body);
                    var player = [];
                    $('#myTable tr').each(function (index) {

                        if (index == 0) return;

                        var data = {};
                        var __name = $(this).find('td:nth-child(3)').find('a').text().split(/,/);
                        var str_name = '', space = '';
                        for (var i = __name.length - 1; i >= 0; i--) {
                            str_name += space + __name[i].trim();
                            space = ' ';
                        }
                        data.name = str_name.trim();
                        data.country = $(this).find('td:nth-child(4)').text().trim();
                        data.birth = $(this).find('td:nth-child(5)').text().trim().replace(/\s/g, '-');
                        data.rank = $(this).find('td:nth-child(6)').text();
                        data.refer = domain + $(this).find('td:nth-child(3)').find('a').attr('href');

                        player[index] = data;
                    });

                    var datetime = new Date(),
                        date = (datetime.getDate() + 1) < 10 ? '0' + (datetime.getDate() + 1) : datetime.getDate() + 1,
                        month = datetime.getMonth() + 1 < 10 ? '0' + (datetime.getMonth() + 1) : datetime.getMonth() + 1,
                        year = datetime.getFullYear(),
                        link = 'http://www.wtatennis.com/fragment/wtaTennis/fragments/assets/rankings/rankingsData/type/SINGLES/date/'
                            + (date + month + year) + '/pag/';
                    $('select.rankings-rank-change option').each(function(index) {
                        topLink[index] = link + $(this).val();
                    });

                    callback(player, null, topLink);
                }
            }
        ]);
    }

    self.Profile = function (url, callback, refer) {
        var crawler = utils.getCrawler(null);
        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    $ = cheerio.load(result.body);
                    var player = {};
                    try {
                        $('#biography h2').remove();
                        player.des = $('#biography').html().replace(/'/g, "\\'");
                        player.gender = 0;
                        player.avatar = $('.player-bio img.playerImage').attr('src');
                    } catch (e) {
                    }

                    callback(player, null, refer);
                }
            }
        ]);
    }
}

exports.WtaTennisHtmlParse = new WtaTennisHtmlParse();