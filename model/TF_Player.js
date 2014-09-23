/**
 * Created by Administrator PC on 9/13/14.
 */
var utils = require('./../utils/Utils').Utils;
var config = {
    "host": "localhost",
    "user": "root",
    "password": "vertrigo",
    'database': "tennis_fanstatistic"
};
var PlayerObject = module.exports.PlayerObject = function (s) {
    var s = s || {};

    this.table = s.table || 'players';

    var f = {};
    s.field = s.field || {};

    f.id = s.field.id || 0;
    f.name = s.field.name || '';
    f.gender = s.field.gender || 0; // Female
    f.birth = s.field.birth || '';
    f.country = s.field.country || '';
    f.avatar = s.field.avatar || '';
    f.win = s.field.win || 0;
    f.lose = s.field.lose || 0;
    f.rank = s.field.rank || 0;
    f.des = s.field.des || '';
    f.status = s.field.status || 0;

    this.field = f;

    return this;
}

var PlayerModel = function() {
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
        var sql = "SELECT " + (fields ? fields : '*') + " FROM `" + PlayerObject().table
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
        var sql = "SELECT " + (field ? field : '*') + " FROM `" + PlayerObject().table
            + "` WHERE " + (con ? con : '1=1');

        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err, refer);
        });
        utils.endMySql(conn);
    }

    self.insertPlayer = function(data, callback, refer) {
        var conn = utils.getMySql(config);
        var field = '',
            value = '',
            comma = '';
        for(var o in data) {
            field += comma + '`' + o + '`';
            value += comma + "'" + data[o] + "'";
            comma = ',';
        }
        var sql = "INSERT IGNORE INTO " + PlayerObject().table
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
        var sql = "INSERT IGNORE INTO " + PlayerObject().table
            + "(" + field + ") VALUES" + value;
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err, refer);
        });
        utils.endMySql(conn);
    }

    self.executeQuery = function(sql, callback, refer) {
        /**
         * Result update
        {
            "fieldCount": 0,
            "affectedRows": 1, // 0 if not update
            "insertId": 0,
            "serverStatus": 2,
            "warningCount": 1,
            "message": "(Rows matched: 1  Changed: 1  Warnings: 1",
            "protocol41": true,
            "changedRows": 1 // 0 if not update or data not change
        }*/

        var conn = utils.getMySql(config);
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err, refer);
        });
        utils.endMySql(conn);
    }
}
exports.PlayerModel = new PlayerModel();