module.exports = {
    port: process.env.PORT || 4000,
    directory: __dirname,
    sessionSecret: 'GKSLDJNVMXCNVPSJGSPOEGJPFKXLC23652873$*&(#@*&%&@#',
    muscle: __dirname + '/bin/muscle3.8.31_i86linux64',
    mail: 'lhmg.ohg@yandex.ru',
    mailPassword: 'dfjdl%q-3gdsVFalks_3-',
    mailOptions: {
        from: 'lhmg.ohg@yandex.ru',
        subject: 'ohg. Your mtDNA analysis results are ready!',
        text: ''
    },

    redisPort: process.env.REDIS_PORT || 6379,
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisAuth: process.env.REDIS_AUTH || null
};