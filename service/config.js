/* eslint-disable no-process-env */

const bunyan = require('bunyan');
const Promise = require('bluebird');
const uuid = require('uuid/v4');

// Promises suck but Bluebird makes them suck less
Promise.promisifyAll(require('next'));

const Redis = require('ioredis');
const pjson = require('../package.json');
const env = process.env.NODE_ENV;
const isDev = env !== 'production';
const maxAge = 1209600000; // 2 weeks

const logger = bunyan.createLogger({
  name: pjson.name,
  serializers: {
    req: bunyan.stdSerializers.req,
    res: bunyan.stdSerializers.res,
    err: bunyan.stdSerializers.err
  }
});

const redisConfig = {
  host:process.env.REDIS_HOST,
  port:process.env.REDIS_PORT || 6379,
  keyPrefix:'codetest.tictactoe.'
};

const redis = new Redis(redisConfig);
const redisSub = new Redis(redisConfig);
const redisPub = new Redis(redisConfig);

module.exports = {
  env,
  isDev,
  signals: ['SIGTERM', 'SIGINT'],
  logger,
  redis,
  redisSub,
  redisPub,
  redisConfig,
  primus: {
    transformer: 'websockets',
    maxAge: '2 weeks',
    pingInterval: '10000',
    parser: 'JSON',
    idGenerator: uuid
  },
  redisStore: {
    client: redis
  },
  sessionHandling: {
    name: 'tictactoe.sid',
    secret: 'iloveunicorns',
    resave: true,
    genid: uuid,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      sameSite: true,
      secure: !isDev,
      maxAge
    }
  },
  service: {
    port: process.env.PORT || 3000
  },
  next: {
    dev: isDev,
    dir: './client'
  }
};
