/**
 * Created by Administrator PC on 8/20/14.
 */

var utils = require('./../../utils/Utils').Utils,
    youTubeHtmlParse = require('./../../utils/YouTubeHtmlParse').YouTubeHtmlParse,
    youTubeModel = require('./../../model/YouTube'),
    setting = require('./../../setting'),
    cheerio = require('cheerio');

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
            var result = {},
                model = youTubeModel.youTubeModel,
                youTubeApi = 'https://gdata.youtube.com/feeds/api/videos/';
            for (var i = 0; i < Object.keys(data).length; i++) {
                var youtube = data[i]; //youTubeModel.YouTube(data[i]);

                /*youTubeHtmlParse.DetailScraper(youtube.link, function (data, err) {
                    result[data.youtubeId] = data;
                    // Save to database
                    data['cid'] = cid;
                    var model = youTubeModel.youTubeModel;
                    //model.saveNews(data);
                }, youtube);*/
                youTubeHtmlParse.ParseDetailApi(youTubeApi + data[i].youtubeId + '?v=2&alt=jsonc', function(data) {
                    result[data.youtubeId] = data;
                }, data[i]);
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

    self.getUpdateData = function(req, res) {
        // Read data in database
        var data = youTubeModel.youTubeModel.getUtils(
            "SELECT `video`, `created_time` FROM `news` WHERE `video` != ''",
            function(rows, err) {
            var sql = '', comma = '';
            var inc = 0;
            var youTubeApi = 'https://gdata.youtube.com/feeds/api/videos/';
            for(var o in rows) {
                youTubeHtmlParse.ParseDetailApi(youTubeApi + rows[o].video + '?v=2&alt=jsonc', function(data) {
                    inc++;
                    if(data.created_time == 'undefined') {
                        sql = "DELETE FROM `news` WHERE `video`='" + data.video + "'";
                    } else
                        sql = "UPDATE `news` SET `created_time`='" + data.publish + "', `likeCount`='" + data.likeCount
                            + "', `thumb`='" + data.thumb + "', `viewed`='" + data.viewed + "', `main_img`='" + data.img + "', `duration`='"
                            + data.duration + "', `description`='"  + escape(data.content) + "' WHERE `video`='" + data.video + "'";
                    youTubeModel.youTubeModel.getUtils(sql, function(rows, err) {
                        if(err) throw err;
                    });
                }, rows[o]);
            }
            var myTimer = setInterval(function() {
                if(inc == Object.keys(rows).length) {
                    clearInterval(myTimer);
                    /*youTubeModel.youTubeModel.getUtils(sql, function(rows, err) {
                        res.send(err || sql);
                    });*/
                    res.json({'result' : 'finished'});
                }
            }, 500);
        })

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

                        var dateString = data[o].created_time
                        try {
                            var dateParts = dateString.split(' '),
                                timeParts = dateParts[1].split(':'),
                                date;
                            dateParts = dateParts[0].split('-');
                            date = new Date(Date.UTC(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2], timeParts[0], timeParts[1], timeParts[2]));
                            dateString = date.getTime()/1000;

                        } catch(e) {

                        }
                        data[o].created_time = dateString;

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

    self.getSearch = function(req, res) {
        var kw = req.query.kw || '',
            youTubeUrl = 'https://www.youtube.com/results?search_query=' + kw,
            youTubeApi = 'https://gdata.youtube.com/feeds/api/videos/',
            result = {};
        youTubeHtmlParse.CategoryScraper(youTubeUrl, function (data) {
            for(var i = 0; i < Object.keys(data).length; i++) {
                youTubeHtmlParse.ParseDetailApi(youTubeApi + data[i].youtubeId + '?v=2&alt=jsonc', function(data) {
                    result[data.youtubeId] = data;
                }, data[i]);
            }

            var inc = 0;
            var myTime = setInterval(function() {
                if(Object.keys(data).length == Object.keys(result).length || inc > 15) {
                    clearInterval(myTime);
                    res.json(result);
                }
                inc++;
            }, 1000);
        });
    }
}

exports.YouTube = new YouTube();