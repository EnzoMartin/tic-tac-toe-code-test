const expect = require('expect');
const sinon = require('sinon');

const Service = require('../service/service');

describe('service module', () => {
  it('exposes the Service class with an initialize method', () => {
    expect(typeof Service).toBe('function');
    expect(typeof new Service().initialize).toBe('function');
  });

  describe('Service class instance method', () => {
    let service;
    let redirectSpy;
    let nextSpy;
    let res;
    const request = {};

    before(() => {
      service = new Service();
    });

    beforeEach(() => {
      redirectSpy = sinon.spy();
      nextSpy = sinon.spy();

      res = {
        redirect: redirectSpy
      };
    });

    describe('redirectNonWww', () => {
      it('redirects non-www to www', () => {
        const req = {
          ...request,
          headers: {
            host: 'test.com'
          },
          protocol: 'https',
          originalUrl: '/custom'
        };

        Service.redirectNonWww(req, res, nextSpy);
        expect(nextSpy.notCalled).toBe(true);
        expect(
          redirectSpy.calledWith(
            301,
            `${req.protocol}://www.test.com${req.originalUrl}`
          )
        ).toBe(true);
      });

      it('does not redirect www', () => {
        const req = {
          ...request,
          headers: {
            host: 'www.test.com'
          }
        };

        Service.redirectNonWww(req, res, nextSpy);
        expect(nextSpy.calledOnce).toBe(true);
      });
    });
  });
});
