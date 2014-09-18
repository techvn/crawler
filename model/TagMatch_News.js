/**
 * Created by Administrator PC on 9/13/14.
 */
/**
 * Created by Administrator PC on 9/13/14.
 */
var utils = require('./../utils/Utils').Utils;
var config = {
    "host": "localhost",
    "user": "root",
    "password": "vertrigo",
    'database': "tag_match"
};

var NewsObject = module.exports.NewsObject = function (s) {
    var s = s || {};

    this.table = s.table || 'news';
    s.field = s.field || {};

    var f = {};
    f.idNews = s.field.idNews || 0;
    f.title  = s.field.title || '';
    f.authors = s.field.authors || '';
    f.postedData= s.field.postedData || '';
    s.source = s.field.source || ''; // Link origin
    s.content = s.field.content || '';
    s.indexingStatus= s.field.indexingStatus || 0;

    this.field = f;
    return this;
}


var NewsModel = function() {
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
        var conn = utils.getMySql(config);
        var sql = "SELECT " + (fields ? fields : '*') + " FROM `" + NewsObject().table
            + "` WHERE " + (con ? con : '1=1')
            + ' ORDER BY ' + (order ? order : '`id` DESC') + (limit != 'all' ? ' LIMIT ' + (limit ? limit : '0, 10') : '');
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
    self.getDetail = function(field, con, callback, refer) {
        var conn = utils.getMySql(config);
        var sql = "SELECT " + (field ? field : '*') + " FROM `" + NewsObject().table
            + "` WHERE " + (con ? con : '1=1');
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err, refer);
        });
        utils.endMySql(conn);
    }

    self.insertSingle = function(data, callback, refer) {
        var conn = utils.getMySql(config);
        var field = '',
            value = '',
            comma = '';
        for(var o in data) {
            field += comma + '`' + o + '`';
            value += comma + "'" + data[o] + "'";
            comma = ',';
        }
        var sql = "INSERT IGNORE INTO " + NewsObject().table
            + "(" + field + ") VALUE(" + value + ")";
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            // rows data
            /*{
             "fieldCount": 0,
             "affectedRows": 1,
             "insertId": 2,
             "serverStatus": 2,
             "warningCount": 3,
             "message": "",
             "protocol41": true,
             "changedRows": 0
             }*/
            callback(rows, err, refer);
        });
        utils.endMySql(conn);
    }

    self.insertMulti = function(data, callback, refer) {
        var conn = utils.getMySql(config);
        var field = '',
            value = '',
            comma = '',
            inc = 0;
        for(var o in data) {
            value += comma + "("
            comma = ''; // Reset coma
            for(var o2 in data[o]) {
                if(inc == 0) {
                    field += comma + '`' + o2 + '`';
                }
                value += comma + "'" + data[o][o2] + "'";
                comma = ',';
            }
            inc++;
            value += ")";
        }
        var sql = "INSERT IGNORE INTO " + NewsObject().table
            + "(" + field + ") VALUES" + value;
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err, refer);
        });
        utils.endMySql(conn);
    }

    self.executeQuery = function(sql, callback, refer) {
        var conn = utils.getMySql(config);
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err, refer);
        });
        utils.endMySql(conn);
    }
}
exports.NewsModel = new NewsModel();