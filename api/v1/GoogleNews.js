/**
 * Created by Administrator PC on 8/20/14.
 */

var utils = require('./../../utils/Utils').Utils,
    googleNewsHtmlParse = require('./../../utils/GoogleNewsHtmlParse').GoogleNewsHtmlParse,
    googleNews = require('./../../model/GoogleNews'),
    setting = require('./../../setting');

function GoogleNews() {
    var self = this;

    self.getDetail = function(req, res) {
        var url = req.query.url;
        if(url == null || url == '') {
            res.json({
                'err' : 'Url detail is invalided'
            });
        }

        // Read page
        googleNewsHtmlParse.DetailScraper(url, function() {

        }, googleNews.GoogleNews());
    }

    self.getList = function(req, res) {
        // Last 24 hours, and sort by time
        // http://news.google.com/news?hl=vi&output=rss&q=ice+bucket+challenge&pz=1&cf=all&ned=vi_vn
        // http://news.google.com/news?hl=en&output=rss&q=ice+bucket+challenge&um=1&gl=us&authuser=0&ie=UTF-8

        var url = req.query.url;
        if(url == null || url == '') {
            res.json({
                'err' : 'Url detail is invalided'
            });
        }
        // Read page
        googleNewsHtmlParse.CategoryScraper(url, function(data) {

            res.json(data);
            return;

            // data : [[googleNews : [img : '', author : '', title : '', brief : ''], url : ''], [...]]
            for(var i = 0; i < data.length; i++) {
                var googleObj = googleNews.GoogleNews(data[i]['googleNews']);
                googleNewsHtmlParse.DetailScraper(url, function() {

                }, googleObj);
            }
        });
    }
}
exports.GoogleNews = new GoogleNews();