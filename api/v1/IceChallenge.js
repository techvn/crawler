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
            agent = new apnagent.Agent();
        // configure agent
        agent.set('key file', join(__dirname, 'arsenal/ck_new.pem'))
            .set('passphrase', 'abc123').enable('sandbox');
        app.set('apn', agent); //.set('apn-env', 'live-production')

        var message = req.body.message,
            token = req.body.token,
            agent = app.get('apn');

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

    self.getPushNotification2 = function(req, res) {
        var notify = require('push-notify');
        var apn = notify.apn({
            key: join(__dirname, 'arsenal/ck_new.pem'),
            passphrase: 'abc123'
        });

        // Send a notification.
        apn.send({
            token: 'b6f2881c360b74c81e16c9b8e33bac91d5597a6cb43c5d16468347be766ee5fa',
            alert: 'Fu*k Son!'
        });
        apn.on('transmitted', function (notification, device) {
            res.send(notification);
        });
        apn.on('transmissionError', function (errorCode, notification, device) {
            notification.err = errorCode;
            console.log(errorCode);
            res.send(notification);
        });
        apn.on('error', function (error) {
            //res.send(error);
        });
    }

    self.getPush = function(req, res) {
        var apns = require('apn');
        var root = process.cwd();
        var fs = require('fs');

        var options = {
            cert: ROOT_PATH + '/arsenal/ck_new.pem',                 /* Certificate file path */
            certData: null,                   /* String or Buffer containing certificate data, if supplied uses this instead of cert file path */
            key: null,                  /* Key file path */
            keyData: null,                    /* String or Buffer containing key data, as certData */
            passphrase: 'abc123',                 /* A passphrase for the Key file */
            ca: null,                         /* String or Buffer of CA data to use for the TLS connection */
            gateway: 'gateway.sandbox.push.apple.com',/* gateway address */
            port: 2195,                       /* gateway port */
            enhanced: true,                   /* enable enhanced format */
            errorCallback: undefined,         /* Callback when error occurs function(err,notification) */
            cacheLength: 100                  /* Number of notifications to cache for error purposes */
        };

        var apnsConnection = new apns.Connection(options);

        var myDevice = new apns.Device('b6f2881c360b74c81e16c9b8e33bac91d5597a6cb43c5d16468347be766ee5fa');

        var note = new apns.Notification('hi');

        note.payload = {};
        note.device = myDevice;

        apnsConnection.sendNotification(note);
    }
}

exports.IceChallenge = new IceChallenge();