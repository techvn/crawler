/**
 * Created by Administrator PC on 8/20/14.
 */
var utils = require('./../utils/Utils').Utils;

var YouTube = module.exports.YouTube = function (s) {
    var s = s || {};

    this.title = s.title || '';
    this.brief = s.brief || '';
    this.img = s.img || [];
    this.video = s.video || ""; // Link video
    this.content = s.content || ''; // YouTube have no content
    this.comments = s.comments || [];
    this.author = s.author || '';
    this.publish = s.publish || new Date().toString();
    this.domain = 'youtube.com';
    this.link = s.link || ''; // Link detail

    return this;
}

function youTubeModel() {
    var self = this;

    self.getList = function(params, callback) {
        var conn = utils.getMySql();

        var sql = "SELECT `id`, `title`, `thumb`, `main_img`, `author`, `brief`, `created_time`, `crawled_time`, `video`, `viewed`, `duration` FROM `news` WHERE 1=1";

        var condition = '';
        if(typeof params['kw'] != 'undefined' & params['kw'] != '') {
            condition += " AND (`title` LIKE '%" + params['kw'] + "%' OR `brief` LIKE '%" + params['kw'] + "%' OR `description` LIKE '%" + params['kw'] + "%')"
        }
        sql += condition + " AND `link_origin` LIKE '%youtube.com%' AND `created_time` != 'undefined'";

        var order = ' ORDER BY `crawled_time` DESC, `id` ASC';
        sql += order;

        var limit = '0, 10';
        if(typeof params['limit'] != 'undefined') {
            limit = params['limit'];
        }
        sql += ' LIMIT ' + limit;
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err);
        });
        utils.endMySql(conn);
    }
    /**
     * Load detail google news
     * @param params
     * @param callback
     */
    self.getDetail = function(params, callback) {
        var conn = utils.getMySql();
        var sql = "SELECT * FROM `news` WHERE `id`=" + params['id'];
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err);
        });
        utils.endMySql(conn);
    }

    self.getUtils = function(sql, callback) {
        var conn = utils.getMySql();
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err);
        });
        utils.endMySql(conn);
    }

    // -------------------

    self.insertNews = function (data) {

        var connection = utils.getMySql();

        // Interaction with db
        // do something ...
        var date = require('./../utils/Utils').getDateDbString();

        var sql = "INSERT IGNORE INTO `news` (`title`, `brief`, `main_img`, `description`, `author`, `created_time`, "
            + "`cat_id`, `viewed`, `video`, `duration`, `link_origin`, `crawled_time`, `status`)"
            + " values('" + escape(data['title']) + "', '" + escape(data['brief']) + "', '"
            + data['img'] + "', '" + escape(data['content']) + "', '"
            + data['author'] + "', '" + data['publish'] + "', '" + data['cid'] + "', '"
            + data['viewed'] + "', '" + data['youtubeId'] + "', " + data['duration'] + ",'" + data['link'] + "', '" + date + "', 1)";

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
            if(obj[i].publish == 'undefined') { continue; }
            value += comma + "('" + escape(data['title']) + "', '" + escape(data['brief']) + "', '"
                + data['img'] + "', '" + escape(data['content']) + "', '"
                + data['author'] + "', '" + data['publish'] + "', '" + data['cid'] + "', '"
                + data['viewed'] + "', '" + data['youtubeId'] + "', " + data['duration']  + "','" + data['link'] + "', '" + date + "', 1)";
            comma = ',';
        }
        var sql = "INSERT IGNORE INTO `news` (`title`, `brief`, `main_img`, `description`, `author`, `created_time`, "
            + "`cat_id`, `viewed`, `video`, `duration`, `link_origin`, `crawled_time`, `status`) values" + value;
        connection.query(sql, function(err, rorws, field) {
            callback(sql, err);
        });
        // End connection
        utils.endMySql(connection);
    }
}
exports.youTubeModel = new youTubeModel();