/**
 * Created by Administrator PC on 8/12/14.
 */
var utils = require('./../../utils/Utils').Utils,
    cnnHtmlParse = require('./../../utils/CnnHtmlParse').CnnHtmlParse,
    cnnModel = require('./../../model/Cnn'),
    setting = require('./../../setting');

function Test() {
    var self = this;

    /**
     * Test crawl
     * @param req
     * @param res
     */
    self.getCrawl = function (req, res) {
        var url = req.query.url;
        if (url.indexOf('edition.cnn.com') > 0) {
            cnnHtmlParse.NewsScraper(url, function (data, err) {
                if (err != null) {
                    res.send(err);
                } else {
                    res.json(data);
                }
            }, cnnModel.Cnn());
        } else {
            res.send('CNN news is invalid url!');
        }
    }

    /**
     * Test crawl category cnn page
     * @param req
     * @param res
     */
    self.getCrawlByCategory = function (req, res) {
        var url = req.query.url;
        // Main category of news
        var cat = req.query.cat || 1;
        if (url.indexOf('edition.cnn.com') > 0) {
            cnnHtmlParse.CategoryScraper(url, function (links, err) {
                if (links.length > 0) {
                    for (var i = 0; i < links.length; i++) {
                        if (links[i] == null) continue;
                        cnnHtmlParse.NewsScraper(links[i], function (data, err) {
                            if (err != null) {
                                console.log(err);
                                return;
                            }
                            // Normalize data
                            data['cid'] = cat;
                            self.saveToDb(data);
                        }, cnnModel.Cnn());
                    }
                    res.send('Finished');
                } else {
                    res.send(err);
                }
            });
        } else {
            res.send('CNN category is invalid url!');
        }
    }

    self.getList = function (req, res) {
        var title = req.query.title;
        var des = req.query.des;
        var keyword = req.query.keyword;
        var cat = req.query.cat;

        var mysql = require('mysql');
        var connection = mysql.createConnection({
            "host": "localhost",
            "user": "root",
            "password": "vertrigo",
            'database': "reporttube"
        });
        connection.connect();

        var sql = "SELECT `id`, `title`, `brief`, `main_img`, `created_time`, `author` FROM `news` ORDER BY `id` DESC LIMIT 50";
        if (keyword != '' & keyword != null) {
            // Search by keyword
            sql = "SELECT `id`, `title`, `brief`, `main_img`, `created_time`, `author` FROM `news` " +
                "WHERE (`title` LIKE '%" + escape(keyword) + "%' OR `description` LIKE '%"
                + escape(keyword) + "%') " + (cat != null & cat != '' ? " AND `cat_id`=" + parseInt(cat) : "")
                +" ORDER BY `id` DESC LIMIT 50";
        } else if((title != null & title != '') || (des != null & des != '')) {
            // Select by title and des
            sql = "SELECT `id`, `title`, `brief`, `main_img`, `created_time`, `author` " +
                "FROM `news` WHERE 1=1 " + (title!=null? " AND `title` LIKE '%" + escape(title) +"%'" : '')
                + (des != null ? " AND `des` LIKE '%" + escape(des) + "%'" : "")
                + (cat != null & cat != '' ? " AND `cat_id`=" + parseInt(cat) : "") + " ORDER BY `id` DESC LIMIT 50";
        } else if(cat != null & cat != '') {
            // Select by cat
            sql = "SELECT `id`, `title`, `brief`, `main_img`, `created_time`, `author` FROM `news` " +
                "WHERE 1=1 AND `cat_id`=" + parseInt(cat) + " ORDER BY `id` DESC LIMIT 50";
        }

        connection.query(sql, function (err, rows, fields) {
            if(!err) {
                var data = [];
                for(var i =0; i < rows.length; i++) {
                    rows[i]['title'] = unescape(rows[i]['title']);
                    data[i] = rows[i];
                }
                res.json(data);
            } else {
                console.log(err);
                err['sql'] = sql;
                res.json(err);
            }
        });
        connection.end();
    }

    self.getListCat = function(req, res) {
        var mysql = require('mysql');
        var connection = mysql.createConnection({
            "host": "localhost",
            "user": "root",
            "password": "vertrigo",
            'database': "reporttube"
        });
        connection.connect();
        var sql = "SELECT * FROM `categories` WHERE `status`=1";
        connection.query(sql, function(err, rows, fields) {
            res.json(!err ? rows : err);
        })
    }

    /**
     * Get detail
     * @param req
     * @param res
     */
    self.getNewsDetail = function(req, res) {
        var id = req.query.id || 0;
        var connection = utils.getMySql();
        var sql = "SELECT * FROM `news` WHERE `id` = " + id + " AND `status` = 1";
        connection.query(sql, function(err, rows, fields) {
            res.json(err || rows);
        });
    }

    self.getCategoryMap = function(req, res) {
        // Load list categories of destination
        var connection = utils.getMySql();
        var sql = "SELECT * FROM `categories_map` WHERE `enabled` = 1";
        connection.query(sql, function(err, rows, fields) {
            if(!err) {
                for(var i = 0; i < rows.length; i++) {

                }
            }
        });
        connection.end();
    }

    // --------- Private function
    /**
     * Save data to database
     * @param data Array[title, img, brief, contents, author, publish, link
     */
    self.saveToDb = function (data) {

        utils.save(data);

        /*var connection = utils.getMySql();

        // Interaction with db
        // do something ...
        var date = require('./../../utils/Utils').getDateDbString();

        var sql_select = "SELECT `id` FROM `news` WHERE `link_origin` = '" + data['link'] + "'";
        connection.query(sql_select, function (err, rows, fields) {

            // Check link crawl has existed
            if (rows.length == 0 & !err) {
                var sql = "INSERT INTO `news` (`title`, `brief`, `main_img`, `description`, `author`, `created_time`, " +
                    "`cat_id`, `link_origin`, `crawled_time`, `status`) " +
                    "VALUES('" + escape(data['title']) + "', '" + data['brief'] + "', '" + JSON.stringify(data['img']) + "', '" + escape(data['content'])
                    + "', '" + data['author'] + "', '" + data['publish'] + "', '" + data['cid']
                    + "','" + data['link'] + "', '" + date + "', 1) ";
                connection.query(sql, function (err, rows, fields) {
                    if (!err) {
                        // Do something if error
                        console.log('Insert link ' + data['link'] + ' success.');
                    }
                });
            }
            connection.end();
        });*/
    }

    self.crawlByCategory = function(url, cat) {

        if (url.indexOf('edition.cnn.com') > 0) {
            cnnHtmlParse.CategoryScraper(url, function (links, err) {
                if (links.length > 0) {
                    for (var i = 0; i < links.length; i++) {
                        if (links[i] == null) continue;
                        cnnHtmlParse.NewsScraper(links[i], function (data, err) {
                            if (err != null) {
                                console.log(err);
                                return;
                            }
                            // Normalize data
                            data['cid'] = cat;
                            self.saveToDb(data);
                        }, cnnModel.Cnn());
                    }
                } else {
                    console.log(err);
                }
            });
        } else {
            console.log('CNN category is invalid url!');
        }
    }

    /**
     * Test connect and get data from mysql
     * @param req
     * @param res
     */
    self.getConnectMySql = function (req, res) {

        var connection = utils.getMySql();

        connection.connect();
        connection.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
            if (err) throw err;
            res.send('The solution is: ' + rows[0].solution);
        });
        connection.end();
    }

}

exports.Test = new Test();