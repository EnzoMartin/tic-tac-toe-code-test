const config = require('./config');

const express = require('express');
const async = require('async');
const next = require('next');

// Middleware imports
const bunyan = require('express-bunyan-logger');
const compression = require('compression');

// Configuration
const { service, logger, redis, signals } = config;
const app = next(config.next);
const handle = app.getRequestHandler();

class Service {
  constructor() {
    this.log = logger.child({ logger: 'service' });

    this.server = express();

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

    this.setupMiddleware();
    this.setupRoutes();
  }

  initialize() {
    app
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

  setupCORS() {
    this.server.use(Service.redirectNonWww);

    this.server.use((req, res, next) => {
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

  setupMiddleware() {
    this.server.use(
      compression({
        filter(req, res) {
          return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
        },
        level: 9
      })
    );

    this.server.use(
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

    this.server.use('/static', express.static('./client/static'));

    this.server.set('x-powered-by', false);
    this.server.set('trust proxy', 1);
  }

  setupRoutes() {
    this.server.get('/', (req, res) => {
      app.render(req, res, '/', ['']);
    });

    this.server.get('/play/:id', (req, res) => {
      app.render(req, res, '/room', ['']);
    });

    this.server.get('/watch/:id', (req, res) => {
      app.render(req, res, '/room', ['']);
    });

    this.server.get('*', (req, res) => {
      return handle(req, res);
    });
  }

  stop() {
    this.log.info('Attempting to shut down service gracefully');

    async.parallel(
      [
        (callback) => {
          redis.disconnect(callback);
        }
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
    this.server.listen(service.port, (err) => {
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
