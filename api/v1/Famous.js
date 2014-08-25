/**
 * Created by Administrator PC on 8/25/14.
 */

var utils = require('./../../utils/Utils').Utils;

function Famous() {
    var self = this;
    self.getList = function(req, res) {
        var kw = req.query.kw || '';
        var conn = utils.getMySql();
        conn.query('SELECT `name` FROM `famous_list`' + (kw != '' ? ' WHERE `name` LIKE "%' + kw + '%"' : ''), function(err, rows, fields) {
            if(!err) {
                var data = [];
                for(var o in rows) {
                    data[o] = rows[o]['name'];
                }
                rows = data;
            }
            res.json(err || rows);
        })
        utils.endMySql(conn);
    }
}

exports.Famous = new Famous();