'use strict';

var handy = require('./handy');
var redis = require('./redis');

var crypto = require('crypto');

module.exports.randomString = function(filename) {
    var random_string = filename + Date.now() + Math.random();
    return crypto.createHash('md5').update(random_string).digest('hex');
};

module.exports.arrayMin = function(arr) {
    var len = arr.length, min = Infinity;
    while (len--) {
        if (arr[len] < min) {
            min = arr[len];
        }
    }
    return min;
};

module.exports.sortNumber = function(a, b) {
    return a - b;
};

module.exports.addHaplogroup = function(name, parentHg, mutations) {
    redis.get('ohg:hg:' + parentHg, function(error, parentMutations) {
        if (parentMutations) {
            var fullSet = parentMutations.split(',').concat(mutations.map(function(m, i, mutations) {return m + ''})).sort(handy.sortNumber);
            redis.rpush('ohg:hgs', name);
            redis.set('ohg:hg:' + name, fullSet + '');
        }
    });
};