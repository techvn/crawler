/**
 * Created by Administrator PC on 8/20/14.
 */
var utils = require('./../utils/Utils').Utils;

var GoogleNews = module.exports.GoogleNews = function(s) {
    var s = s || {};

    this.title = s.title || '';
    this.brief = s.brief || '';
    this.img = s.img || [];
    this.video = s.video || ""; // Link video
    this.content = s.content || ''; // YouTube have no content
    this.comments = s.comments || [];
    this.author = s.author || '';
    this.publish = s.publish || new Date().toString();
    this.domain = 'news.google.com';
    this.link = s.link || ''; // Link detail

    return this;
}

function googleNewsModel() {
    var self = this;

    self.insertNews = function (data) {

        var connection = utils.getMySql();

        // Interaction with db
        // do something ...
        var date = require('./../utils/Utils').getDateDbString();

        var sql = "INSERT IGNORE INTO `news` (`title`, `brief`, `main_img`, `description`, `author`, `created_time`, "
            + "`cat_id`, `link_origin`, `crawled_time`, `status`)"
            + " values('" + escape(data['title']) + "', '" + escape(data['description']) + "', '"
            + JSON.stringify(data['img']) + "', '" + escape(data['description']) + "', '"
            + (typeof data['author'] != 'undefined' ? data['author'] : "")  + "', '" + data['pubDate'] + "', '" + data['cid'] + "', '"
            + data['link'] + "', '" + date + "', 1)";

        connection.query(sql, function (err, rows, fields) {
            if (!err) {
                // Do something if error
                console.log('Insert link ' + data['link'] + ' success.');
            } else
                console.log(err);
        });
        //console.log(sql);

        utils.endMySql(connection);
    }

    /**
     * Insert multi rows by sql query
     * @param obj: Array 2 dimension
     */
    self.insertMultiNews = function(obj, callback) {
        var connection = utils.getMySql();

        // Interaction with db
        var date = require('./../utils/Utils').getDateDbString();

        var value = '', comma = '';
        for(var i in obj) {
            var data = obj[i];
            value += comma + "('" + escape(data['title']) + "', '" + escape(data['description']) + "', '"
                + JSON.stringify(data['img']) + "', '" + escape(data['description']) + "', '"
                + (typeof data['author'] != 'undefined' ? data['author'] : "") + "', '" + data['pubDate'] + "', '" + data['cid'] + "', '"
                + data['link'] + "', '" + date + "', 1)";
            comma = ',';
        }
        var sql = "INSERT IGNORE INTO `news` (`title`, `brief`, `main_img`, `description`, `author`, `created_time`, "
            + "`cat_id`, `link_origin`, `crawled_time`, `status`) values" + value;
        connection.query(sql, function(err, rorws, field) {
            callback(sql, err);
        });
        // End connection
        utils.endMySql(connection);
    }
}
exports.googleNewsModel = new googleNewsModel();