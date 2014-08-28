/**
 * Created by Administrator PC on 8/27/14.
 */
var utils = require('./../utils/Utils').Utils;

function PushToken() {
    var self = this;
    self.insertToken = function(data, callback) {
        var conn = utils.getMySql();
        var date = new Date();
        var sql = "INSERT INTO `push_token`(`token`, `os`, `created_time`) " +
            "values('" + data['token'] + "', '" + data['os'] + "', " + (date.getTime() / 1000) + ")";
        conn.query(sql, function(err, rows, fields) {
            callback(rows, err);
        })
        utils.endMySql(conn);
    }
}

exports.PushToken = new PushToken();