module.exports = {
    port: process.env.PORT || 3000,
    directory: __dirname,
    sessionSecret: 'GKSLDJNVMXCNVPSJGSPOEGJPFKXLC23652873$*&(#@*&%&@#',

    redisPort: process.env.REDIS_PORT || 6379,
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisAuth: process.env.REDIS_AUTH || null
};