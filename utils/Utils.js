var SETTING = require('config').Setting,
    REDIS = require('config').Redis,
    winston = require('winston');
var Utils = function () {
    var self = this;

    self._crawler = null;
    self._redis = null;

    /**
     * @returns crawler.Crawler
     */
    self.getCrawler = function () {
        var self = this;
        if (null == self._crawler) {
            var Crawler = require('crawler').Crawler;
            self._crawler = new Crawler({
                "timeout" : 30000, //30s
                "jQuery" : false
            });
        }

        return self._crawler;
    }

    /**
     *
     * @returns redis.RedisClient
     */
    self.getRedis = function(db) {
        db = db || 0;
        if (null == self._redis) {
            var redis = require('redis'),
                client = redis.createClient(REDIS.port, REDIS.host, REDIS.options || {});

            if (REDIS.auth) {
                client.auth(REDIS.auth);
            }

            self._redis = client;

            self._redis.on("ready", function() {
                console.log('Connect to redis server');
            });

            self._redis.on("error", function() {
                console.log('Redis connection error');
                self._redis.end();
                self._redis = null;
            });
        }

        self._redis.select(db);

        return self._redis;
    }

    self.crawlingCacheExist = function (uri) {
        var redis = self.getRedis(1);
        return redis.exist(uri);
    }

    self.crawlingFetchCacheUri = function(uri) {
        var redis = self.getRedis(1);
        return redit.get(uri);
    }

    self.crawlingCacheUri = function(uri, result) {
        var redis = self.getRedis(1);
        redis.set(uri, JSON.stringify({
            'time' : Date.now().toString(),
            'uri' : uri,
            'html' : result.body
        }));
        redis.expire(uri, 300);//expire after 5 minute
    }

    /**
     * Write file content
     * @param dir
     * @param fileName
     * @param data
     */
    self.writeContentToFile = function(dir, fileName, data) {
        fs.exists(dir + fileName, function(existed) {
            if(existed) {
                fs.readFile(dir + fileName, function(err, _data) {
                    data += '/n' + _data;
                    fs.writeFile(dir + fileName, data, function(err) {
                        // Write file finished
                    });
                });
            } else {
                fs.writeFile(dir + fileName, data, function(err) {});
            }
        });
    }
}

var today = new Date();
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'debug' }),
        new (winston.transports.File)({ level: 'warn', filename: global.ROOT_PATH + '/' +SETTING.log_dir +'/' +today.getFullYear()+'_'+today.getMonth()+'_'+today.getDate() +'.log' })
    ],
    exceptionHandlers: [
        new (winston.transports.Console)({ level: 'debug' }),
        new (winston.transports.File)({ level: 'info', filename: global.ROOT_PATH + '/' + SETTING.log_dir +'/err_' +today.getFullYear()+'_'+today.getMonth()+'_'+today.getDate() +'.log' })
    ]
});

exports.Utils = new Utils();
exports.Logger = logger;
exports.getDateDbString = function(date) {
    if (!date) {
        date = new Date();
    }

    if (!(date instanceof Date)) {
        return null;
    }

    var _m = date.getMonth(),
        _d = date.getDate(),
        _h = date.getHours(),
        _i = date.getMinutes(),
        _s = date.getSeconds();

    _m = (_m < 9)? '0'+(_m + 1):(_m+1); // Number of month is started with zero
    _d = (_d < 10)? '0'+_d:_d;
    _h = (_h < 10)? '0'+_h:_h;
    _i = (_i < 10)? '0'+_i:_i;
    _s = (_s < 10)? '0'+_s:_s;

    return date.getFullYear() +'-' +_m +'-' +_d +' '+_h +':' +_i +':' +_s;
}