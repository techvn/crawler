/**
 * Module dependencies.
 */

var express = require('express')
    , ApiServer = require('./api/ApiServer').ApiServer
    , routes = require('./routes')
    , sugar = require('sugar')
    , http = require('http')
    , path = require('path')
    , fs = require('fs'),
    apnagent = require('apnagent'),
    join = require('path').join;

global.ROOT_PATH = __dirname;

var app = express();
var apiServer = new ApiServer();

// all environments
app.set('port', process.env.PORT || 1234);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('base_path', __dirname);

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);

//API router
//api/version/method
app.get(/^\/api\/(\w+)\/(\w+)\/(?:(\w+))?$/, function (req, res) {
    req.params[2] = req.params[2] || 'default';
    var packageName = require('./api/' + req.params[0] + '/' + req.params[1])[req.params[1].camelize()],
        method = 'get' + req.params[2].camelize();

    if (req.params[0] != 'v1') {
        method = req.params[2].camelize();
    }

    if (apiServer.verifyRequest(req, res)) {
        if (packageName.hasOwnProperty(method)) {
            packageName[method](req, res);
        } else {
            res.json('API METHOD: GET /api/' + req.params[0] + '/' + req.params[1] + '/' + req.params[2] + ' not found!', 404);
        }
    }

});

/**
 * ---------------------------------------------------
 */
app.configure(function () {
    app.use(express.bodyParser());
});

/**
 * Use a MockAgent for dev/test envs
 */

app.configure('development', 'test', function () {
    var agent = new apnagent.MockAgent();

    // no configuration needed

    // mount to app
    app
        .set('apn', agent)
        .set('apn-env', 'mock');
});

/**
 * Usa a live Agent with sandbox certificates
 * for our staging environment.
 */

app.configure('staging', function () {
    var agent = new apnagent.Agent();

    // configure agent
    agent
        .set('cert file', join(__dirname, 'ả.pem'))
        .set('key file', join(__dirname, 'certs/apn/dev-key.pem'))
        .enable('sandbox');

    // mount to app
    app
        .set('apn', agent)
        .set('apn-env', 'live-sandbox');
});

/**
 * Use a live Agent with production certificates
 * for our production environment.
 */

app.configure('production', function () {
    var agent = new apnagent.Agent();

    // configure agent
    agent
        .set('cert file', join(__dirname, 'certs/apn/prod-cert.pem'))
        .set('key file', join(__dirname, 'certs/apn/prod-key.pem'));

    // mount to app
    app
        .set('apn', agent)
        .set('apn-env', 'live-production');
});

/**
 * Set our environment independant configuration
 * and event listeners.
 */

app.configure(function () {
    var agent = app.get('apn')
        , env = app.get('apn-env');

    // common settings
    agent
        .set('expires', '1d')
        .set('reconnect delay', '1s')
        .set('cache ttl', '30m');

    // see error mitigation section
    agent.on('message:error', function (err, msg) {
        // ...
    });

    // connect needed to start message processing
    agent.connect(function (err) {
        if (err) throw err;
        console.log('[%s] apn agent running', env);
    });
});

/**
 * Sample endpoint
 */

app.get('/apn', function (req, res) {
    var agent = app.get('apn')
        , alert = 'Fu*k Son!' //req.body.alert
        , token = 'b6f2881c360b74c81e16c9b8e33bac91d5597a6cb43c5d16468347be766ee5fa'; //req.body.token;

    agent.createMessage()
        .device(token)
        .alert(alert)
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
});
/**
 * ----------------------------------------------------------------
 */

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
