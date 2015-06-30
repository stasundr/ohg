'use strict';

var config = require('./../config');
var sequence = require('./sequence');
var handy = require('./handy');

var spawn = require('child_process').spawn;
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Yandex',
    auth: {
        user: config.mail,
        pass: config.mailPassword
    }
});

module.exports = function(app) {

    app.get('/', function(request, response) {
        if (typeof request.session.fileList === 'undefined') {
            request.session.fileList = [];
            request.session.filesToAnalyze = [];
        }

        response.render('index', { sampleList: request.session.filesToAnalyze } );
    });

    app.get('/samples', function(request, response) {
        response.json(request.session.fileList);
    });

    app.post('/addfile', function(request, response) {}); // take a look here -> app.js app.use(multer)

    app.post('/addurl', function(request, response) {
        var gbNumber = request.body.url;
        var tmp_filename = handy.randomString(gbNumber);
        var tmp_filepath = config.directory + '/uploads/' + tmp_filename + '.fa';

        sequence.downloadFromGenbank(gbNumber, tmp_filepath, function() {
            sequence.process(tmp_filepath, tmp_filename +'.fa', function(listItem, actualFile) {
                if (listItem) {
                    request.session.fileList.push(listItem);
                    request.session.filesToAnalyze.push(actualFile);
                }

                response.redirect('/');
            });
        });
    });

    app.get('/analyze', function(request, response) {

        if (request.query.reference == 'rCRS') {
            request.session.fileList.push('rCRS');
            request.session.filesToAnalyze.push('reference/rCRS.fa');
        }

        if (request.query.reference == 'RSRS') {
            request.session.fileList.push('RSRS');
            request.session.filesToAnalyze.push('reference/RSRS.fa');
        }

        sequence.combine(request.session.filesToAnalyze, function(name) {
            console.log('still here');
            var muscle = spawn(config.muscle, ['-in', name, '-out', name + '.muscle', '-maxiters', '1', '-diags']);

            muscle.on('close', function (code) {
                console.log('muscle exited with code ' + code);

                if (code == 0) {
                    sequence.separate(name + '.muscle', function(names, sequences) {
                        var differences = {};
                        differences.box = [];

                        var i;
                        var referenceIndex;
                        var ref;

                        for (i = 0; i < names.length; i++) {
                            if (names[i] == '>' + request.query.reference) {
                                referenceIndex = i;
                            }
                        }
                        ref = sequences[referenceIndex];

                        for (i = 0; i < sequences.length; i++) {
                            var currentSequence = sequences[i];
                            var realPosition = 0;

                            differences.box[i] = [];
                            for (var j = 0; j < currentSequence.length; j++) {
                                if ((ref.charAt(j) !== '-') && (currentSequence[j] !== '-')) {
                                    if (ref.charAt(j) !== '-') realPosition++;

                                    if (currentSequence[j] !== ref.charAt(j)) {
                                        differences.box[i].push(realPosition);
                                    }
                                }
                            }
                        }

                        // Mail message text
                        var text = '';
                        var k = 0;
                        config.mailOptions.to = request.query.mail;

                        for (i = 0; i < names.length; i++) {
                            sequence.haplogroup(names[i], differences.box[i], function(name, hg) {
                                text += name + ' belongs to ' + hg + '\n';
                                k++;

                                //console.log(text);
                                if (k == names.length) {
                                    config.mailOptions.text += text;
                                    transporter.sendMail(config.mailOptions, function (error, info) {
                                        if (error) throw error;

                                        console.log('Message sent: ' + info.response);
                                    });
                                    config.mailOptions.text = '';
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    app.get('/logout', function(request, response) {
        request.session.destroy();
        response.redirect('/');
    });

    app.get('/results', function(request, response) {
        response.render('results');
    });

    app.get('/new', function(request, response) {
        request.session.filesToAnalyze = [];
        request.session.fileList = [];
        response.redirect('/');
    });
};