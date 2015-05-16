'use strict';

var config = require('./config');
var redis = require('./lib/redis');
var sequence = require('./lib/sequence');

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var multer  = require('multer');
var session = require('express-session');
var redisStore = require('connect-redis')(session);

var app = express();
module.exports = app;

app.set('view engine', 'ejs');

//app.disable('etag'); // http://stackoverflow.com/questions/18811286/nodejs-express-cache-and-304-status-code

app.use(morgan('dev'));
app.use(express.static(config.directory + '/public'));
app.use(bodyParser.urlencoded( { extended: false } ));
app.use(session({
    store: new redisStore({ client: redis }),
    resave: false,
    saveUninitialized: true,
    secret: config.sessionSecret
}));
app.use(multer({
    dest: './uploads/',
    onFileUploadComplete: function (file, request, response) {
        console.log(file.fieldname + ' uploaded to  ' + file.path);

        sequence.process(file.path, file.name, function(listItem, actualFile) {
            if (listItem) {
                request.session.fileList.push(listItem);
                request.session.filesToAnalyze.push(actualFile);
            }

            response.json({ upload: true });
        });
    }

    // validate file size
}));

require('./lib/routes')(app);