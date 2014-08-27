/**
 * Created by Administrator PC on 8/25/14.
 */

var utils = require('./../../utils/Utils').Utils,
    express = require('express'),
    apnagent = require('apnagent'),
    join = require('path').join;

function IceChallenge() {
    var self = this;
    self.getFamousList = function(req, res) {
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

    self.getPushNotification = function(req, res) {
        var app = express(),
            agent = app.get('apn'),
            message = req.body.message,
            token = req.body.token,
            agent = new apnagent.Agent();

        // configure agent
        agent.set('cert file', join(__dirname, 'certs/apn/prod-cert.pem'))
            .set('key file', join(__dirname, 'certs/apn/prod-key.pem'));

        // mount to app
        app.set('apn', agent).set('apn-env', 'live-production');

        agent.createMessage()
            .device(token)
            .alert(message)
            .send(function (err) {
                // handle apnagent custom errors
                if (err && err.toJSON) {
                    res.json(400, { error: err.toJSON(false) });
                }

                // handle anything else (not likely)
                else if (err) {
                    res.json(400, { error: err.message });
                }
                // it was a success
                else {
                    res.json({ success: true });
                }
            });
    }
}

exports.IceChallenge = new IceChallenge();