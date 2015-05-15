'use strict';

var config = require('./../config');

var fs = require('fs');
var http = require('http');
var crypto = require('crypto');

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

module.exports.download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);  // close() is async, call cb after close completes.
        });
    }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
    });
};

module.exports.combine = function(filesToAnalyze, callback) {
    var random_name = function(filename) {
        var random_string = filename + Date.now() + Math.random();
        return crypto.createHash('md5').update(random_string).digest('hex');
    };

    var resultFile = config.directory + '/uploads/' + random_name('') + '.fa';
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
                    currentSequence += lines[i]; // mb trim \n
                }
            }
        }

        callback(sequencesNames, sequences);
    });
};