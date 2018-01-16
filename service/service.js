const config = require('./config');

const http = require('http');
const express = require('express');
const Primus = require('primus');
const primusRooms = require('primus-rooms');
const async = require('async');
const next = require('next');

// Middleware imports
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const RedisStore = require('connect-redis')(session);
const cookie = require('cookie');
const cookieParser = require('cookie-parser');

// Modules
const Player = require('./modules/player');
const Room = require('./modules/room');

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
    this.setupApiRoutes();
    this.setupPageRoutes();
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
      redisSub.subscribe('actions');
      redisSub.subscribe('rooms');
      redisSub.subscribe('players');

      redisSub.on('message', (channel, message) => {
        switch (channel) {
          case 'rooms':
            Room.getAll((err, data) => {
              if (err) {
                logger.error({ err }, 'Failed to get rooms');
              } else {
                this.primus.in('lobby').write({ type: channel, data });
              }
            });
            break;
          case 'actions':
            Room.getSingle(message, (err, data) => {
              if (err) {
                logger.error({ err }, `Failed to get room ${message}`);
              } else {
                this.primus.in(message).write({ type: channel, data });
              }
            });
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
    this.primus.save(`${__dirname}/../client/static/primus.js`);

    this.primus.plugin('rooms', primusRooms);

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

      spark.on('data', (data) => {
        switch (data.type) {
          case 'join':
            spark.join(data.id);
            break;
          case 'leave':
            spark.leave(data.id);
            break;
          default:
            logger.info(`Got unhandled event type "${data.type}"`);
            break;
        }
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

    this.app.use('/static', express.static('./client/static'));

    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());

    this.app.set('x-powered-by', false);
    this.app.set('trust proxy', 1);
  }

  setupApiRoutes() {
    // Create room
    this.app.post('/rooms', (req, res) => {
      Room.create(req.sessionID, req.body.symbol, (err, roomId) => {
        if (!err) {
          redisPub.publish('rooms', null);
        }

        res.json(err || { status: 'success', roomId });
      });
    });

    // Join room as player
    this.app.post('/rooms/:id', (req, res) => {
      Room.join(req.params.id, req.sessionID, req.body.symbol, (err, result) => {
        let status = 'success';
        if (!err) {
          redisPub.publish('rooms', null);
        }

        // Player 2 already exists
        if (!result.p2) {
          res.status(409);
          status = 'failed';
        }

        res.json(err || { status });
      });
    });

    // Make a move
    this.app.put('/rooms/:id', (req, res) => {
      Room.play(req.params.id, req.sessionID, req.body.cell, (err, result) => {
        let status = 'success';
        redisPub.publish('actions', req.params.id);

        // Cell already occupied
        if (!result) {
          res.status(409);
          status = 'failed';
        } else if (result === 2) {
          // Game finished, update the lobbies
          redisPub.publish('rooms', null);
        }

        res.json(err || { status });
      });
    });
  }

  setupPageRoutes() {
    this.app.get('/', (req, res) => {
      Room.getAll((err, data) => {
        client.render(req, res, '/', {
          playerId: req.sessionID,
          data: err ? [] : data
        });
      });
    });

    this.app.get('/rooms/:id', (req, res) => {
      Room.getSingle(req.params.id, (err, data) => {
        client.render(req, res, '/room', {
          playerId: req.sessionID,
          data: err ? [] : data
        });
      });
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
