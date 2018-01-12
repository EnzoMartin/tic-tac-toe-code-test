const expect = require('expect');
const proxyquire = require('proxyquire').noPreserveCache();
const dotenv = require('dotenv');
dotenv.config();

describe('config module', () => {
  let env;
  let config;

  beforeEach(() => {
    env = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = env;
  });

  it('sets to use development configuration if not production', () => {
    process.env.NODE_ENV = 'development';
    config = proxyquire('../service/config', {});

    expect(config.isDev).toBe(true);
    expect(config.next.dev).toBe(true);
  });

  it('sets to use production configuration if production', () => {
    process.env.NODE_ENV = 'production';
    config = proxyquire('../service/config', {});

    expect(config.isDev).toBe(false);
    expect(config.next.dev).toBe(false);
  });
});
