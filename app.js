/**
 * Module dependencies.
 */

var express = require('express')
    , ApiServer = require('./api/ApiServer').ApiServer
    , routes = require('./routes')
    , sugar = require('sugar')
    , http = require('http')
    , path = require('path')
    , fs        = require('fs');

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
app.use(express.bodyParser());
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
            res.json('API METHOD: GET /api/'+req.params[0]+'/'+req.params[1]+'/'+req.params[2] + ' not found!', 404);
        }
    }

});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
