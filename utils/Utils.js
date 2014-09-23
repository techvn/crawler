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
    self.getWinner = function (player_1, player_2, data) {
        var score = data.split(/\s/);
        var winner_1 = 0, winner_2 = 0, tmp = []; // default player 1
        for (var o in score) {
            if (score[o].indexOf('-') == -1) {
                continue;
            }
            tmp = score[o].split(/-/);
            if (parseInt(tmp[0]) > parseInt(tmp[1].substr(0, 1))) {
                winner_1++;
            } else winner_2++;
        }
        return winner_1 > winner_2 ? player_1 : player_2;
    }

    /**
     * Uppercase all first charactor of words in string
     * @param str
     * @returns {string}
     */
    self.ucFirstAllWords = function (str) {
        var pieces = str.split(" ");
        for (var i = 0; i < pieces.length; i++) {
            var j = pieces[i].charAt(0).toUpperCase();
            pieces[i] = j + pieces[i].substr(1);
        }
        return pieces.join(" ");
    }

    /**
     * Get day of week
     * @param d
     * @returns {number}
     */
    self.getWeek = function (d) {
        // Create a copy of this date object
        var target = new Date();
        if (d == null) {
            d = new Date();
        }

        // ISO week date weeks start on monday
        // so correct the day number
        var dayNr = (d.getDay() + 6) % 7;

        // ISO 8601 states that week 1 is the week
        // with the first thursday of that year.
        // Set the target date to the thursday in the target week
        target.setDate(target.getDate() - dayNr + 3);

        // Store the millisecond value of the target date
        var firstThursday = target.valueOf();

        // Set the target to the first thursday of the year
        // First set the target to january first
        target.setMonth(0, 1);
        // Not a thursday? Correct the date to the next thursday
        if (target.getDay() != 4) {
            target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }

        // The weeknumber is the number of weeks between the
        // first thursday of the year and the thursday in the target week
        return 1 + Math.ceil((firstThursday - target) / 604800000); // 604800000 = 7 * 24 * 3600 * 1000
    }

    /**
     * Get first date of week
     * @param year
     * @param week
     * @returns {*}
     */
    self.getFirstDateOfWeek = function (year, week) {
        var year = year || new Date().getFullYear();
        var week = week || self.getWeek(null); //week number is 31 for the example, could be 120.. it will just jump trough years

        // get the date for the first day of the year
        var firstDateOfYear = new Date(year, 0, 1);
        // set the date to the number of days for the number of weeks
        firstDateOfYear.setDate(firstDateOfYear.getDate() + (7 * (week - 1)));
        // get the number of the day in the week 0 (Sun) to 6 (Sat)
        var counter = firstDateOfYear.getDay();

        //make sunday the first day of the week
        for (i = 0; i < counter; i++) {
            firstDateOfYear.setDate(firstDateOfYear.getDate() - 1)
        }

        var firstDateOfWeek = new Date(firstDateOfYear);    // copy firstDateOfYear

        var dateNumbersOfMonthOnWeek = [];                   // output array of date #s
        var datesOfMonthOnWeek = [];                         // output array of Dates

        for (var i = 0; i < 7; i++) {                        // for seven days...
            dateNumbersOfMonthOnWeek.push(                   // push the date number on
                firstDateOfWeek.getDate());                  // the end of the array

            datesOfMonthOnWeek.push(                         // push the date object on
                new Date(+firstDateOfWeek));                 // the end of the array

            firstDateOfWeek.setDate(
                firstDateOfWeek.getDate() + 1);              // move to the next day
        }
        // Return first date of week
        return firstDateOfWeek.setDate(
            firstDateOfWeek.getDate() + 1);
        ;
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