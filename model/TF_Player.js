/**
 * Created by Administrator PC on 9/13/14.
 */
var utils = require('./../utils/Utils').Utils;
var PlayerObject = module.exports.PlayerObject = function (s) {
    var s = s || {};

    this.table = s.table || 'players';

    var f = {};
    s.field = s.field || {};

    f.id = s.field.id || 0;
    f.name = s.field.name || '';
    f.birth = s.field.birth || '';
    f.country = s.field.country || '';
    f.avatar = s.field.avatar || '';
    f.win = s.field.win || 0;
    f.lose = s.field.lose || 0;
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
        var conn = utils.getMySql();
        var sql = "SELECT " + (fields ? fields : '*') + " FROM `" + PlayerObject.table
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
        var sql = "SELECT " + (fields ? fields : '*') + " FROM `" + PlayerObject.table
            + "` WHERE " + (con ? con : '1=1');
        conn.query(sql, function(err, rows, fields) {
            if(err) { err['sql'] = sql; }
            callback(rows, err);
        });
        utils.endMySql(conn);
    }
}
exports.PlayerModel = new PlayerModel();