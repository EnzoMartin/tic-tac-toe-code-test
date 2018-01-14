const config = require('./config');

const http = require('http');
const express = require('express');
const Primus = require('primus');
const Rooms = require('primus-rooms');
const async = require('async');
const next = require('next');

// Middleware imports
const bunyan = require('express-bunyan-logger');
const compression = require('compression');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const cookie = require('cookie');
const cookieParser = require('cookie-parser');

// Modules
const Player = require('./modules/player');

// Configuration
const { service, logger, redis, redisPub, sessionHandling, redisStore, primus, redisSub, signals } = config;
const client = next(config.next);
const handle = client.getRequestHandler();

class Service {
  constructor() {
    this.log = logger.child({ logger: 'service' });

    this.app = express();
    this.server = http.createServer(this.app);

    // Handle the Docker kill signals and attempt a graceful shutdown
    signals.forEach((signal) => {
      process.once(signal, () => {
        this.stop();
      });
    });

    // Delicious security
    if (!config.isDev) {
      this.setupCORS();
    }

    this.setupSession();
    this.setupWebSockets();
    this.setupPubSub();
    this.setupMiddleware();
    this.setupRoutes();
  }

  initialize() {
    client
      .prepare()
      .then(() => {
        this.start();
      })
      .catch((err) => {
        this.log.error({ err }, 'Encountered an error trying to start service');
      });
  }

  static redirectNonWww(req, res, next) {
    const host = req.headers.host;
    if (host.slice(0, 4) !== 'www.') {
      return res.redirect(
        301,
        `${req.protocol}://www.${host}${req.originalUrl}`
      );
    }
    next();
  }

  setupSession() {
    this.app.use(session({
      store: new RedisStore(redisStore),
      ...sessionHandling
    }));
  }

  setupCORS() {
    this.app.use(Service.redirectNonWww);

    this.app.use((req, res, next) => {
      res.set({
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=1209600',
        'X-Content-Type-Options': 'nosniff',
        'x-frame-options': 'sameorigin',
        'X-Frame-Options': 'deny',
        'x-xss-protection': '\'1; mode=block\' always',
        'content-security-policy': [
          'default-src https: \'self\' \'unsafe-inline\' data:',
          'child-src \'self\' https://www.google.com/',
          'media-src \'self\'',
          'object-src \'self\'',
          'script-src https: \'self\' \'unsafe-inline\' https://google-analytics.com https://*.doubleclick.net https://google.com',
          'connect-src https: \'self\' wss: \'self\'',
          'font-src https: \'self\' data:',
          'img-src https: \'self\' data: https://google-analytics.com https://google.com https://*.doubleclick.net',
          'style-src https: \'self\' \'unsafe-inline\'',
          'frame-ancestors \'self\''
        ].join('; ')
      });

      next();
    });
  }

  setupPubSub() {
    redisSub.on('ready', () => {
      redisSub.psubscribe('room:*');
      redisSub.subscribe('rooms');
      redisSub.subscribe('players');

      redisSub.on('message', (channel, message) => {
        console.log('Got message', channel, message);
        switch (channel) {
          case 'rooms':
            break;
          case 'players':
            Player.getOnlineList((err, data) => {
              if (err) {
                logger.error({ err }, 'Failed to get players online');
              } else {
                this.primus.in('lobby').write({ type: channel, data });
              }
            });
            break;
          default:
            logger.info(`Got unhandled message on channel "${channel}"`);
            break;
        }
      });
    });
  }

  setupWebSockets() {
    this.primus = new Primus(this.server, primus);

    this.primus.plugin('rooms', Rooms);

    this.primus.on('connection', (spark) => {
      if (!spark.headers.cookie) {
        // Malformed session, kill it with fire
        return spark.end();
      }
      const sparkId = spark.id;
      const parsedCookies = cookie.parse(spark.headers.cookie);
      const playerId = cookieParser.signedCookie(parsedCookies[sessionHandling.name], sessionHandling.secret);

      spark.join(playerId);
      spark.join('lobby');

      Player.addConnectedSocket(playerId, sparkId, (err) => {
        if (err) {
          logger.error({ err }, 'Failed to save connected socket');
        }

        redisPub.publish('players', null);
      });

      spark.on('end', () => {
        Player.removeConnectedSocket(playerId, sparkId, (err) => {
          if (err) {
            logger.error({ err }, 'Failed to remove disconnected socket');
          }

          redisPub.publish('players', null);
        });
      });
    });
  }

  setupMiddleware() {
    this.app.use(
      compression({
        filter(req, res) {
          return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
        },
        level: 9
      })
    );

    /*
    this.app.use(
      bunyan({
        logger: this.log,
        // Who hates console spam? Me!
        excludes: [
          'body',
          'req-headers',
          'res-headers',
          'user-agent',
          'response-hrtime'
        ]
      })
    );
    */

    this.app.use('/static', express.static('./client/static'));

    this.app.set('x-powered-by', false);
    this.app.set('trust proxy', 1);
  }

  setupRoutes() {
    this.app.get('/', (req, res) => {
      // console.log('Session ID', req.sessionHandling.id)
      // console.log('Session Cookie', req.sessionCookies.get(sessionHandling.name))
      client.render(req, res, '/', ['']);
    });

    this.app.get('/play/:id', (req, res) => {
      client.render(req, res, '/room', ['']);
    });

    this.app.get('/watch/:id', (req, res) => {
      client.render(req, res, '/room', ['']);
    });

    this.app.get('*', (req, res) => {
      return handle(req, res);
    });
  }

  stop() {
    this.log.info('Attempting to shut down service gracefully');

    async.parallel(
      [
        (callback) => { redis.disconnect(callback); },
        (callback) => { redisPub.disconnect(callback); },
        (callback) => { redisSub.disconnect(callback); }
      ],
      (err) => {
        let exitCode = 0;
        if (err) {
          this.log.error({ err }, 'Failed to shutdown gracefully');
          exitCode = 1;
        } else {
          this.log.info('Graceful shutdown complete');
        }

        // eslint-disable-next-line no-process-exit
        process.exit(exitCode);
      }
    );
  }

  start() {
    this.server = this.server.listen(service.port, (err) => {
      if (err) {
        this.log.error({ err }, 'Service failed to start');
        throw err;
      } else {
        this.log.info(`Service started on http://localhost:${service.port}`);
      }
    });
  }
}

module.exports = Service;
