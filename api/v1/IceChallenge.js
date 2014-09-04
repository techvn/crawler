/**
 * Created by Administrator PC on 8/25/14.
 */

var utils = require('./../../utils/Utils').Utils,
    express = require('express'),
    apnagent = require('apnagent'),
    join = require('path').join,
    youTubeHtmlParse = require('./../../utils/YouTubeHtmlParse').YouTubeHtmlParse;

function IceChallenge() {
    var self = this;
    self.getFamousList = function (req, res) {
        var kw = req.query.kw || '',
            id = req.query.id || 0,
            limit = req.query.limit || '5',
            conn = utils.getMySql();
        conn.query('SELECT `id`, `name`, `birth`, `thumb`, `brief`, `video`, `news` FROM `famous_list` WHERE `status`=1 '
            + (kw != '' ? ' AND `name` LIKE "%' + kw + '%"' : '') + (id != 0 ? " AND `id`=" + id : '')
            + (limit ? ' LIMIT ' + limit : ''), function (err, rows, fields) {
            if (!err) {
                var inc = 0,
                    url_video = '',
                    url_news = '',
                    youTubeApi = 'https://gdata.youtube.com/feeds/api/videos/',
                    googleNewsHtmlParse = require('./../../utils/GoogleNewsHtmlParse').GoogleNewsHtmlParse;
                for (var o in rows) {
                    rows[o].birth = require('./../../utils/Utils').getDateDbString(rows[o].birth);
                    rows[o].video = {};
                    rows[o].news = [];

                    // Check has video
                    //if(!rows[o].video | rows[o].video == null) {
                    url_video = 'https://www.youtube.com/results?search_query=ice+bucket+challenge+' + rows[o].name.replace(/\s/g, '+');
                    youTubeHtmlParse.CategoryScraper(url_video, function (data, refer) {
                        if (Object.keys(data).length == 0) {
                            inc++;
                            return;
                        }
                        for (var i = 0; i < Object.keys(data).length; i++) {
                            //rows[o].video = data[i];
                            //console.log(data[i].youtubeId);
                            youTubeHtmlParse.ParseDetailApi(youTubeApi + data[i].youtubeId + '?v=2&alt=jsonc', function (data, refer) {
                                inc++;
                                rows[refer].video = data;
                                console.log(data);
                            }, data[i], refer);
                            break;
                        }
                    }, o);
                    //}

                    // Feed news
                    url_news = 'https://news.google.com/news/feeds?hl=en&output=rss&q=ice+bucket+challenge+'
                        + rows[o].name.replace(/\s/g, '+') + '&um=1&gl=us&authuser=0&ie=UTF-8';
                    console.log(url_news);
                    googleNewsHtmlParse.CategoryScraper(url_news, function(data, refer) {
                        var obj = [];
                        for(var o in data) {
                            obj.push(data[o]);
                        }
                        rows[refer].news = obj;
                    }, null, o);
                }

                var time = 0;
                var timer = setInterval(function () {
                    if (inc == Object.keys(rows).length | time >= 100) {
                        res.json(err || rows);
                        clearInterval(timer);
                    }
                    time++;
                }, 250);

            } else {
                res.json(err);
            }
        });

        utils.endMySql(conn);
    }

    self.getFamous = function (req, res) {
        var id = req.query.id || 0,
            conn = utils.getMySql();
        conn.query('SELECT * FROM `famous_list` WHERE `status`=1 AND `id`=' + id, function (err, rows, fields) {
            if (!err) {
                var inc = 0,
                    url_video = '',
                    url_news = '',
                    youTubeApi = 'https://gdata.youtube.com/feeds/api/videos/',
                    googleNewsHtmlParse = require('./../../utils/GoogleNewsHtmlParse').GoogleNewsHtmlParse;
                for (var o in rows) {
                    rows[o].birth = require('./../../utils/Utils').getDateDbString(rows[o].birth);
                    rows[o].video = {};
                    rows[o].news = [];

                    // Check has video
                    //if(!rows[o].video | rows[o].video == null) {
                    url_video = 'https://www.youtube.com/results?search_query=ice+bucket+challenge+' + rows[o].name.replace(/\s/g, '+');
                    youTubeHtmlParse.CategoryScraper(url_video, function (data, refer) {
                        if (Object.keys(data).length == 0) {
                            inc++;
                            return;
                        }
                        for (var i = 0; i < Object.keys(data).length; i++) {
                            //rows[o].video = data[i];
                            //console.log(data[i].youtubeId);
                            youTubeHtmlParse.ParseDetailApi(youTubeApi + data[i].youtubeId + '?v=2&alt=jsonc', function (data, refer) {
                                inc++;
                                rows[refer].video = data;
                                console.log(data);
                            }, data[i], refer);
                            break;
                        }
                    }, o);
                    //}

                    // Feed news
                    url_news = 'https://news.google.com/news/feeds?hl=en&output=rss&q=ice+bucket+challenge+'
                        + rows[o].name.replace(/\s/g, '+') + '&um=1&gl=us&authuser=0&ie=UTF-8';
                    console.log(url_news);
                    googleNewsHtmlParse.CategoryScraper(url_news, function(data, refer) {
                        var obj = [];
                        for(var o in data) {
                           obj.push(data[o]);
                        }
                        rows[refer].news = obj;
                    }, null, o);
                }

                var time = 0;
                var timer = setInterval(function () {
                    if (inc == Object.keys(rows).length | time >= 100) {
                        res.json(err || rows);
                        clearInterval(timer);
                    }
                    time++;
                }, 250);

            } else {
                res.json(err);
            }
        });

        utils.endMySql(conn);
    }

    self.getPushNotification = function (req, res) {
        var app = express(),
            agent = new apnagent.Agent();
        // configure agent
        agent.set('key file', join(__dirname, 'arsenal/ck_new.pem'))
            .set('passphrase', 'abc123').enable('sandbox');
        app.set('apn', agent); //.set('apn-env', 'live-production')

        var message = req.body.message,
            token = req.body.token,
            agent = app.get('apn');

        agent.createMessage()
            .device(token)
            .alert(message)
            .send(function (err) {
                // handle apnagent custom errors
                if (err && err.toJSON) {
                    res.json(400, { error: err.toJSON(false) });
                }

                // handle anything else (not likely)
                else if (err) {
                    res.json(400, { error: err.message });
                }
                // it was a success
                else {
                    res.json({ success: true });
                }
            });
    }

    self.getPushNotification2 = function (req, res) {
        var notify = require('push-notify');
        var apn = notify.apn({
            key: join(__dirname, 'arsenal/ck_new.pem'),
            passphrase: 'abc123'
        });

        // Send a notification.
        apn.send({
            token: 'b6f2881c360b74c81e16c9b8e33bac91d5597a6cb43c5d16468347be766ee5fa',
            alert: 'Fu*k Son!'
        });
        apn.on('transmitted', function (notification, device) {
            res.send(notification);
        });
        apn.on('transmissionError', function (errorCode, notification, device) {
            notification.err = errorCode;
            console.log(errorCode);
            res.send(notification);
        });
        apn.on('error', function (error) {
            //res.send(error);
        });
    }

    self.getPush = function (req, res) {
        var apns = require('apn');
        var root = process.cwd();
        var fs = require('fs');

        var options = {
            cert: ROOT_PATH + '/arsenal/ck_new.pem', /* Certificate file path */
            certData: null, /* String or Buffer containing certificate data, if supplied uses this instead of cert file path */
            key: null, /* Key file path */
            keyData: null, /* String or Buffer containing key data, as certData */
            passphrase: 'abc123', /* A passphrase for the Key file */
            ca: null, /* String or Buffer of CA data to use for the TLS connection */
            gateway: 'gateway.sandbox.push.apple.com', /* gateway address */
            port: 2195, /* gateway port */
            enhanced: true, /* enable enhanced format */
            errorCallback: undefined, /* Callback when error occurs function(err,notification) */
            cacheLength: 100                  /* Number of notifications to cache for error purposes */
        };

        var apnsConnection = new apns.Connection(options);

        var myDevice = new apns.Device('b6f2881c360b74c81e16c9b8e33bac91d5597a6cb43c5d16468347be766ee5fa');

        var note = new apns.Notification('hi');

        note.payload = {};
        note.device = myDevice;

        apnsConnection.sendNotification(note);
    }

    /**
     * Add new token
     * @param req
     * @param res
     */
    self.getToken = function (req, res) {
        var data = {};
        data.token = req.query.key || '';
        data.os = req.query.type || 'ios';

        var token = require('./../../model/PushToken').PushToken;
        token.insertToken(data, function (rows, err) {
            res.json(err || rows);
        });
    }

    self.getUnBlock = function(req, res) {
        var kw = req.query.kw || '',
            id = req.query.id || 0,
            limit = req.query.limit || '5',
            conn = utils.getMySql();
        conn.query('SELECT `id`, `name`, `birth`, `thumb`, `brief`, `video`, `news` FROM `famous_list` WHERE `status`=1 '
            + (kw != '' ? ' AND `name` LIKE "%' + kw + '%"' : '') + (id != 0 ? " AND `id`=" + id : '')
            + (limit ? ' LIMIT ' + limit : ''), function (err, rows, fields) {
            if (!err) {
                var url_news = '',
                    googleNewsHtmlParse = require('./../../utils/GoogleNewsHtmlParse').GoogleNewsHtmlParse;
                for (var o in rows) {
                    // Feed news
                    url_news = 'https://news.google.com/news/feeds?hl=en&output=rss&q=ice+bucket+challenge+'
                        + rows[o].name.replace(/\s/g, '+') + '&um=1&gl=us&authuser=0&ie=UTF-8';
                    googleNewsHtmlParse.CategoryScraper(url_news, function(data, refer) {
                        res.send(data);
                    }, null, o);
                    break;
                }
                return;

            } else {
                res.json(err);
            }
        });

        utils.endMySql(conn);
    }
}

exports.IceChallenge = new IceChallenge();