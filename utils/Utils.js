var SETTING = require('config').Setting,
    REDIS = require('config').Redis,
    winston = require('winston'),
    qs = require('querystring');

exports.processRequest = function (req, callback) {
    var body = '';
    req.on('data', function (data) {
        body += data;
    });
    req.on('end', function () {
        callback(qs.parse(body));
    });
}

var Utils = function () {
    var self = this;

    self._crawler = null;
    self._redis = null;
    self._mySql = null;

    /**
     * @returns crawler.Crawler
     */
    self.getCrawler = function (config) {
        var config = config || {"timeout": 30000, //30s
            "jQuery": false,
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "accept-charset": "gbk;utf-8",
                "content-type": " text/html; charset=utf-8",
                "user-agent": 'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:32.0) Gecko/20100101 Firefox/32.0'
            }};
        var self = this;
        if (null == self._crawler) {
            var Crawler = require('crawler').Crawler;
            self._crawler = new Crawler(config);
        }

        return self._crawler;
    }

    self.getMySql = function (config) {
        var self = this;
        config = config || {
            "host": "localhost",
            "user": "root",
            "password": "vertrigo",
            'database': "reporttube"
        };
        if (null == self._mySql) {
            var mysql = require('mysql');
            self._mySql = mysql.createConnection(config);
            self._mySql.connect();
        }
        return self._mySql;
    }

    self.endMySql = function (connection) {
        self._mySql = null;
        connection.end();
    }

    /**
     *
     * @returns redis.RedisClient
     */
    self.getRedis = function (db) {
        db = db || 0;
        if (null == self._redis) {
            var redis = require('redis'),
                client = redis.createClient(REDIS.port, REDIS.host, REDIS.options || {});

            if (REDIS.auth) {
                client.auth(REDIS.auth);
            }

            self._redis = client;

            self._redis.on("ready", function () {
                console.log('Connect to redis server');
            });

            self._redis.on("error", function () {
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

    self.crawlingFetchCacheUri = function (uri) {
        var redis = self.getRedis(1);
        return redit.get(uri);
    }

    self.crawlingCacheUri = function (uri, result) {
        var redis = self.getRedis(1);
        redis.set(uri, JSON.stringify({
            'time': Date.now().toString(),
            'uri': uri,
            'html': result.body
        }));
        redis.expire(uri, 300);//expire after 5 minute
    }

    /**
     * Write file content
     * @param dir
     * @param fileName
     * @param data
     */
    self.writeContentToFile = function (dir, fileName, data) {
        fs.exists(dir + fileName, function (existed) {
            if (existed) {
                fs.readFile(dir + fileName, function (err, _data) {
                    data += '/n' + _data;
                    fs.writeFile(dir + fileName, data, function (err) {
                        // Write file finished
                    });
                });
            } else {
                fs.writeFile(dir + fileName, data, function (err) {
                });
            }
        });
    }

    /**
     * Get id of player win in match
     * @param player_1 ID of player 1
     * @param player_2 ID of player 2
     * @param data Score of match
     */
    self.getWinner = function(player_1, player_2, data) {
        var score = data.split(/\s/);
        var winner_1 = 0, winner_2 = 0, tmp = []; // default player 1
        for(var o in score) {
            if(score[o].indexOf('-') == -1) { continue; }
            tmp = score[o].split(/-/);
            if(parseInt(tmp[0]) > parseInt(tmp[1].substr(0,1))) {
                winner_1++;
            } else winner_2++;
        }
        return winner_1 > winner_2 ? player_1 : player_2;
    }
}

/*var today = new Date();
 var logger = new (winston.Logger)({
 transports: [
 new (winston.transports.Console)({ level: 'debug' }),
 new (winston.transports.File)({ level: 'warn', filename: global.ROOT_PATH + '/' +SETTING.log_dir +'/' +today.getFullYear()+'_'+today.getMonth()+'_'+today.getDate() +'.log' })
 ],
 exceptionHandlers: [
 new (winston.transports.Console)({ level: 'debug' }),
 new (winston.transports.File)({ level: 'info', filename: global.ROOT_PATH + '/' + SETTING.log_dir +'/err_' +today.getFullYear()+'_'+today.getMonth()+'_'+today.getDate() +'.log' })
 ]
 });*/
//exports.Logger = logger;

exports.Utils = new Utils();
exports.getDateDbString = function (date) {
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

    _m = (_m < 9) ? '0' + (_m + 1) : (_m + 1); // Number of month is started with zero
    _d = (_d < 10) ? '0' + _d : _d;
    _h = (_h < 10) ? '0' + _h : _h;
    _i = (_i < 10) ? '0' + _i : _i;
    _s = (_s < 10) ? '0' + _s : _s;

    return date.getFullYear() + '-' + _m + '-' + _d + ' ' + _h + ':' + _i + ':' + _s;
}