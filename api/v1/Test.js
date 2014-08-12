/**
 * Created by Administrator PC on 8/12/14.
 */

function Test() {
    var self = this;

    /**
     * Test crawl
     * @param req
     * @param res
     */
    self.getCrawl = function(req, res) {
        var url = req.query.url;

        if(url != null & url != '') {
            var Crawler = require('crawler').Crawler;
            var crawler = new Crawler({ });
            crawler.queue([{
                'uri' : url,
                'callback': function(error, result, $) {
                    res.send(result.body);
                }
            }]);
        } else {
            res.send('crawl error!');
        }
    }

    /**
     * Test connect and get data from mysql
     * @param req
     * @param res
     */
    self.getConnectMySql = function(req, res) {
        var mysql      = require('mysql');
        var connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : 'vertrigo'
        });
        connection.connect();
        connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
            if (err) throw err;
            res.send('The solution is: ' + rows[0].solution);
        });
        connection.end();
    }
}

exports.Test = new Test();