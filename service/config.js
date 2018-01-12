/* eslint-disable no-process-env */

const bunyan = require('bunyan');
const Promise = require('bluebird');

// Promises suck but Bluebird makes them suck less
Promise.promisifyAll(require('next'));

const Redis = require('ioredis');
const pjson = require('../package.json');
const env = process.env.NODE_ENV;
const isDev = env !== 'production';

const logger = bunyan.createLogger({
  name: pjson.name,
  serializers: {
    req: bunyan.stdSerializers.req,
    res: bunyan.stdSerializers.res,
    err: bunyan.stdSerializers.err
  }
});

const redis = new Redis({
  host:process.env.REDIS_HOST,
  port:process.env.REDIS_PORT || 6379,
  keyPrefix:'peltarion.tictactoe.'
});

module.exports = {
  env,
  isDev,
  signals: ['SIGTERM', 'SIGINT'],
  logger,
  redis,
  service: {
    port: process.env.PORT || 3000
  },
  next: {
    dev: isDev,
    dir: './client'
  }
};
