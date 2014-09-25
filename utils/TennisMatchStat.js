/**
 * Created by Administrator PC on 9/14/14.
 */
var matchObject = require('./../model/TF_Matches'),
    utils = require('./../utils/Utils').Utils,
    cheerio = require('cheerio');

function TennisMatchStat() {
    var self = this;

    /**
     * Crawl today's match page
     * @param url
     * @param callback
     * @constructor
     */
    self.LoadMatchToday = function(url, callback) {
        var crawler = utils.getCrawler(null);
        crawler.queue([
            {
                'uri': url,
                'callback': function (error, result, $) {
                    var __result = [];
                    try {
                        $ = cheerio.load(result.body);
                        var data = $('#fixtures').find('table');
                        //matchObject.field.table_data = data;

                        //__result.year = '';
                        //__result.tournament = '';
                        $(data).find('tr').each(function(index) {
                            __result[index] = {};
                            if($($(this).find('td')[0]).text().replace(/\s/i, '') != '') {
                                /*__result[index].tournament = $($(this).find('td')[0]).find('b').text().replace(/'/i, "\\'");
                                // Remove tournament data from text
                                $($(this).find('td')[0]).find('b').remove();
                                $($(this).find('td')[0]).find('a').remove();
                                __result[index].year = $($(this).find('td')[0]).text();*/
                                var year_tournament = $($(this).find('td')[0]).text().split(/\s/);
                                __result[index].year = year_tournament[0];
                                year_tournament.splice(0, 1);
                                __result[index].tournament = year_tournament.join(' ');
                            } else {
                                __result[index].tournament = __result[index - 1].tournament;
                                __result[index].year = __result[index - 1].year;
                            }
                            __result[index].player_1 = $($(this).find('td')[2]).text().replace(/'/i, "\\'");
                            __result[index].player_2 = $($(this).find('td')[3]).text().replace(/'/i, "\\'");
                        });
                        callback(__result, null);
                    } catch (e) {
                        callback(__result, e);
                    }
                }
            }
        ]);
    }

    /**
     * Crawl detail player page
     * @param url
     * @param callback
     * @param refer
     * @constructor
     */
    self.LoadDetailPlayer = function(url, callback, refer) {
        var crawler = utils.getCrawler(null);
        crawler.queue({
            'uri': url,
            'callback': function (error, result, $) {
                var data = {};
                try {
                    $ = cheerio.load(result.body);
                    data.tennis_stat_id_map = $('#idPlayer').val();
                    data.birth = $('div.birthDate').text();
                    // Find gender ATP = 1 (male), WTA = 0 (female)
                    data.gender = ($('#matches tr td').text().indexOf('ATP') > -1 ? 1:0);
                    callback(data, null, refer);
                } catch(e) {
                    callback(data, e, refer);
                }
            }
        })
    }

    /**
     * Crawl head-to-head page
     * @param url
     * @param callback
     * @constructor
     */
    self.LoadHeadToHead = function(url, callback, refer) {
        var crawler = utils.getCrawler(null);
        crawler.queue({
            'uri': url,
            'callback': function (error, result, $) {
                var __result = {};
                try {
                    $ = cheerio.load(result.body);
                    var data = $('#fixtures').find('table');
                    $(data).find('tr').each(function(index) {
                        __result[index] = {};
                        if($($(this).find('td')[0]).text().replace(/\s/i, '') != '') {
                            var year_tournament = $($(this).find('td')[0]).text().split(/\s/);
                            __result[index].year = year_tournament[0];
                            year_tournament.splice(0, 1);
                            __result[index].tournament = year_tournament.join(' ').replace(/'/g, "\\'");
                        } else {
                            __result[index].tournament = __result[index - 1].tournament.replace(/'/g, "\\'");
                            __result[index].year = __result[index - 1].year;
                        }
                        __result[index].player_1 = $($(this).find('td')[2]).text().replace(/'/i, "\\'");
                        __result[index].player_2 = $($(this).find('td')[3]).text().replace(/'/i, "\\'");
                        __result[index].surface = $($(this).find('td')[1]).text().replace(/'/i, "\\'");
                        __result[index].score = $($(this).find('td')[4]).text().replace(/'/i, "\\'");
                        __result[index].type = $($(this).find('td')[6]).text().replace(/'/i, "\\'");

                    });
                    callback(__result, null, refer);
                } catch(e) {
                    callback(__result, e, refer);
                }
            }
        })
    }
}
exports.TennisMatchStat = new TennisMatchStat();