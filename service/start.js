// eslint-disable-next-line no-process-env
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv'); // eslint-disable-line global-require
  dotenv.config();
}

const Service = require('./service');

// Queue the explosions! ...by Michael Bay
new Service().initialize();
