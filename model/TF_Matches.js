/**
 * Created by Administrator PC on 9/13/14.
 */
/**
 * Created by Administrator PC on 9/13/14.
 */
var config = {
    "host": "localhost",
    "user": "root",
    "password": "vertrigo",
    'database': "tennis_fanstatistic"
};
var utils = require('./../utils/Utils').Utils;
var MatchObject = module.exports.MatchObject = function (s) {
    var s = s || {};

    this.table = s.table || 'matches';
    if (s.field == null || s.field == 'undefined') {
        s.field = {};
    }

    var f = {};
    f.id = s.field.id || 0;
    f.player_1 = s.field.player_1 || '';
    f.player_2 = s.field.player_2 || '';
    f.year = s.field.year || '';
    f.tournament = s.field.tournament || '';
    f.total_voted_player_1 = s.field.total_voted_player_1 || 0;
    f.total_voted_player_2 = s.field.total_voted_player_2 || 0;

    this.field = f;
    return this;
}

var MatchModel = function () {
    var self = this;
    /**
     * Load list player from database
     * @param fields Custom field query
     * @param con Condition for query
     * @param order Default order by `id` DESC
     * @param limit Limit query rows, default 10 rows (0,10)
     * @param callback Function return 2 params: Rows and Error if it has something wrong
     */
    self.getList = function (fields, con, order, limit, callback) {
        var conn = utils.getMySql(config);
        var sql = "SELECT " + (fields ? fields : '*') + " FROM `" + MatchObject().table
            + "` WHERE " + (con ? con : '1=1')
            + ' ORDER BY ' + (order ? order : '`id` DESC') + (limit != 'all' ? ' LIMIT ' + (limit ? limit : '0, 10') : '');
        conn.query(sql, function (err, rows, fields) {
            if (err) {
                err['sql'] = sql;
            }
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
    self.getDetail = function (field, con, callback, refer) {
        var conn = utils.getMySql(config);
        var sql = "SELECT " + (fields ? fields : '*') + " FROM `" + MatchObject().table
            + "` WHERE " + (con ? con : '1=1');
        conn.query(sql, function (err, rows, fields) {
            if (err) {
                err['sql'] = sql;
            }
            callback(rows, err);
        });
        utils.endMySql(conn);
    }

    self.insertMulti = function (data, callback) {
        var connection = utils.getMySql(config),
            value = '',
            comma = '';
        for (var o in data) {
            value += comma + "('" + data[o].player_1 + "', '" + data[o].player_2 + "', '" + data[o].year + "', '" + data[o].tournament + "')";
            comma = ',';
        }

        var sql = "INSERT IGNORE INTO `" + MatchObject().table
            + "`(`player_1`,`player_2`,`year`,`tournament`) VALUES" + value;
        connection.query(sql, function (err, rorws, field) {
            callback(sql, err);
        });
        // End connection
        utils.endMySql(connection);
    }
}
exports.MatchModel = new MatchModel();