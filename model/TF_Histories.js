/**
 * Created by Administrator PC on 9/13/14.
 */

var HistoryObject = module.exports.HistoryObject = function(s) {
    var s = s || {};

    this.table = s.table || 'histories';

    var f = {};
    s.field = s.field || {};

    f.id = s.field.id || 0;
    f.player_1 = s.field.player_1 || 0;
    f.player_2 = s.field.player_2 || 0;
    f.player1_win = s.field.player1_win || 0;
    f.player1_voted = s.field.player1_voted || 0;
    f.player2_voted = s.field.player2_voted || 0;

    this.field = f;

    return this;
}

function historiesModel() {
    var self = this;

    var self = this;
    /**
     * Load list player from database
     * @param fields Custom field query
     * @param con Condition for query
     * @param order Default order by `id` DESC
     * @param limit Limit query rows, default 10 rows (0,10)
     * @param callback Function return 2 params: Rows and Error if it has something wrong
     */
    self.getList = function(fields, con, order, limit, callback) {
        var conn = utils.getMySql();
        var sql = "SELECT " + (fields ? fields : '*') + " FROM `" + HistoryObject.table
            + "` WHERE " + (con ? con : '1=1')
            + ' ORDER BY ' + (order ? order : '`id` DESC') + ' LIMIT ' + (limit ? limit : '0, 10');
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err);
        });
        utils.endMySql(conn);
    }

    /**
     * Get detail player information
     * @param field
     * @param con
     * @param callback
     */
    self.getDetailPlayer = function(field, con, callback) {
        var conn = utils.getMySql();
        var sql = "SELECT " + (fields ? fields : '*') + " FROM `" + HistoryObject.table
            + "` WHERE " + (con ? con : '1=1');
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
            + "`cat_id`, `viewed`, `likeCount`, `video`, `duration`, `link_origin`, `crawled_time`, `status`)"
            + " values('" + escape(data['title']) + "', '" + escape(data['brief']) + "', '"
            + data['img'] + "', '" + escape(data['content']) + "', '"
            + data['author'] + "', '" + data['publish'] + "', '" + data['cid'] + "', '"
            + data['viewed'] + "', '" + data['likeCount'] + "', '" + data['youtubeId']
            + "', " + data['duration'] + ",'" + data['link'] + "', '" + date + "', 1)";

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
                + data['thumb'] + "', '" + data['img'] + "', '" + escape(data['content']) + "', '"
                + data['author'] + "', '" + data['publish'] + "', '" + data['cid'] + "', '"
                + data['viewed'] + "', '" + data['likeCount'] + "', '" + data['youtubeId']
                + "', '" + data['duration']  + "','" + data['link'] + "', '" + date + "', 1)";
            comma = ',';
        }
        var sql = "INSERT IGNORE INTO `news` (`title`, `brief`, `thumb`, `main_img`, `description`, `author`, `created_time`, "
            + "`cat_id`, `viewed`, `likeCount`, `video`, `duration`, `link_origin`, `crawled_time`, `status`) values" + value;
        connection.query(sql, function(err, rorws, field) {
            callback(sql, err);
        });
        // End connection
        utils.endMySql(connection);
    }
}
exports.historiesModel = new historiesModel();