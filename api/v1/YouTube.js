/**
 * Created by Administrator PC on 8/20/14.
 */

var utils = require('./../../utils/Utils').Utils,
    youTubeHtmlParse = require('./../../utils/YouTubeHtmlParse').YouTubeHtmlParse,
    youTubeModel = require('./../../model/YouTube'),
    setting = require('./../../setting');

function YouTube() {
    var self = this;

    self.getCrawlDetail = function (req, res) {
        var url = req.query.url;
        if (url == null || url == '') {
            res.json({
                'err': 'Url detail is invalided'
            });
        }

        // Read page
        youTubeHtmlParse.DetailScraper(url, function (data, err) {
            res.send(data);
        }, youTubeModel.YouTube());
    }

    self.getCrawlList = function (req, res) {
        // Url: https://www.youtube.com/results?search_sort=video_date_uploaded&filters=today&search_query=ice+bucket+challenge
        var url = req.query.url;
        var cid = req.query.cid || 1;
        if (url == null || url == '') {
            res.json({
                'err': 'Url detail is invalided'
            });
        }

        youTubeHtmlParse.CategoryScraper(url, function (data) {
            /*res.json(data);
             return;*/
            var result = {}, model = youTubeModel.youTubeModel;
            for (var i = 0; i < Object.keys(data).length; i++) {
                var youtube = data[i]; //youTubeModel.YouTube(data[i]);

                youTubeHtmlParse.DetailScraper(youtube.link, function (data, err) {
                    result[data.youtubeId] = data;
                    // Save to database
                    data['cid'] = cid;
                    var model = youTubeModel.youTubeModel;
                    //model.saveNews(data);
                }, youtube);
            }

            var inc = 0;
            var myTask = setInterval(function () {
                inc++;
                if (Object.keys(data).length == Object.keys(result).length || inc > 30) {
                    // Max execute time
                    if (typeof result['undefined'] != 'undefined') {
                        delete result['undefined'];
                    }
                    // Insert to database
                    model.insertMultiNews(result, function (sql, err) {
                        if (err) {
                            res.json({
                                'sql': sql,
                                'err': err
                            });
                        } else {
                            res.json(result);
                        }
                    });

                    clearInterval(myTask);
                }
            }, 1000);
        });
    }

    // API
    self.getList = function (req, res) {
        var limit = req.query.limit || '0, 10',
            kw = req.query.kw || '';
        youTubeModel.youTubeModel.getList(
            {'limit': limit, 'kw': kw }
            , function (data, err) {
                if (err) {
                    res.json(err);
                } else {
                    var d = [];
                    for(var o in data) {
                        data[o].img = (data[o].img);
                        data[o].title = unescape(data[o].title);
                        data[o].brief = unescape(data[o].brief);
                        d[o] = data[o];
                    }
                    res.json(d);
                }
            });
    }

    self.getDetail = function(req, res) {
        var id = req.query.id || 0;
        youTubeModel.youTubeModel.getDetail({'id' : id}, function(data, err) {
            if (err) {
                res.json(err);
            } else {
                var d = [];
                for(var o in data) {
                    data[o].img = (data[o].img);
                    data[o].title = unescape(data[o].title);
                    data[o].brief = unescape(data[o].brief);
                    d[o] = data[o];
                }
                res.json(d);
            }
        })
    }

    self.getLast = function(req, res) {
        var sql = "SELECT * FROM `news` WHERE `link_origin` LIKE '%youtube.com%' ORDER BY `crawled_time` DESC, `id` ASC LIMIT 1";
        youTubeModel.youTubeModel.getUtils({'sql' : sql}, function(data, err) {
            if (err) {
                res.json(err);
            } else {
                var d = [];
                for(var o in data) {
                    data[o].img = (data[o].img);
                    data[o].title = unescape(data[o].title);
                    data[o].brief = unescape(data[o].brief);
                    d[o] = data[o];
                }
                res.json(d);
            }
        })
    }
}

exports.YouTube = new YouTube();