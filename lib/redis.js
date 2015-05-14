'use strict';

var config = require('./../config');

var redis = require('redis');

var client = redis.createClient(config.redisPort, config.redisHost);

if (config.redisAuth) {
    client.auth(config.redisAuth);
}

client.on('error', function(error) {
    throw error;
});

module.exports = client;