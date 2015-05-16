'use strict';

var config = require('./../config');
var handy = require('./handy');

var fs = require('fs');
var http = require('http');

module.exports.process = function(filepath, filename, callback) {
    fs.readFile(filepath, function (error, data) {
        if (error) throw error;

        var lines = data.toString().split("\n"); // fasta validation

        if (lines.length) {
            var flag = false;
            var listItem = false;
            var actualFile = false;

            for (var i = 0; i < lines.length; i++) {
                if (lines[i][0] == '>') {
                    flag = true;
                    listItem = lines[i].substr(1);
                    actualFile = filename;
                }

                if (flag) break;
            }
        }

        callback(listItem, actualFile);
    });
};

// validate fasta function

var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);
        });
    }).on('error', function(err) {
        fs.unlink(dest);
        if (cb) cb(err.message);
    });
};
module.exports.download = download;

module.exports.downloadFromGenbank = function(number, dest, callback) {
    download('http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=' + number + '&rettype=fasta&retmode=text', dest, callback);
};

module.exports.combine = function(filesToAnalyze, callback) {
    var resultFile = config.directory + '/uploads/' + handy.randomString('') + '.fa';
    fs.writeFile(resultFile, '', function (error) {
        if (error) throw error;

        if (filesToAnalyze) {
            filesToAnalyze.forEach(function(currentFile, i, filesToAnalyze) {
                fs.readFile(config.directory + '/uploads/' + currentFile, function (error, data) {
                    data += '\n';
                    if (error) throw error;

                    fs.appendFile(resultFile, data, function(error) {
                        if (error) throw error;

                        if (i == filesToAnalyze.length - 1) callback(resultFile);
                    });
                })
            });
        }
    });
};

module.exports.separate = function(inputFile, callback) {
    fs.readFile(inputFile, function(error, data) {
        if (error) throw error;

        var lines = data.toString().split("\n");
        var currentSequence = '';
        var currentSequenceName = '';
        var flag = false;
        var sequencesNames = [];
        var sequences = [];

        if (lines.length) {
            for (var i = 0; i < lines.length; i++) {
                if (lines[i][0] == '>') {
                    if (currentSequence != '') {
                        sequences.push(currentSequence);
                        sequencesNames.push(currentSequenceName);

                        currentSequence = '';
                        currentSequenceName = '';
                    }

                    flag = false;
                    currentSequenceName = lines[i];
                } else flag = true;

                if (flag) {
                    currentSequence += lines[i];
                }
            }
        }

        callback(sequencesNames, sequences);
    });
};