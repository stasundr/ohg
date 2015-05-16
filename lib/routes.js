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
                                if (ref.charAt(j) !== '-') realPosition++;

                                if (currentSequence[j] != sequences[0][j]) {
                                    differences.box[i].push(realPosition);
                                }
                            }
                        }

                        var text = '';
                        for (i = 0; i < names.length; i++) {
                            text += names[i] + ' \n' + differences.box[i] + '\n\n';
                            console.log(names[i] + ' \n' + differences.box[i] + '\n\n');
                        }

                        config.mailOptions.to = request.query.mail;
                        config.mailOptions.text += text;

                        transporter.sendMail(config.mailOptions, function(error, info){
                            if(error) throw error;

                            console.log('Message sent: ' + info.response);
                        });
                    });
                }
            });
        });

        response.redirect('/');
    });

    app.get('/logout', function(request, response) {
        request.session.destroy();
        response.redirect('/');
    });
};