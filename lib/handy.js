'use strict';

var crypto = require('crypto');

module.exports.randomString = function(filename) {
    var random_string = filename + Date.now() + Math.random();
    return crypto.createHash('md5').update(random_string).digest('hex');
};