'use strict';
var assert = require('assert');
var proxyquire = require('proxyquire');
var sinon = require('sinon');

// setup proxies for module under test
var mongoProviderProxy = {
  '@global': true,
  init: sinon.stub().callsArg(2)
};
var redisProviderProxy = {
  '@global': true,
  init: sinon.stub().callsArg(2)
};
var mbaasSessionMiddleware = proxyquire('../../../lib/cloud/mbaas/mbaas-session-middleware', {
  './mongoProvider': mongoProviderProxy,
  './redisProvider': redisProviderProxy
});

describe('mbaas-session-middleware', function() {
  describe('#addConfigDefaults', function() {
    describe('for redis', function() {
      it('should supply localhost:6379 as a default', function(done) {
        mbaasSessionMiddleware.init({
          store: 'redis'
        }, function() {
          assert(redisProviderProxy.init.calledWithMatch({
            config: {
              host: sinon.match.string,
              port: sinon.match.string
            }
          }));
          return done();
        });
      });
    });
    describe('for mongodb', function() {
      it('should use a localhost url by default', function(done) {
        mbaasSessionMiddleware.init({
          store: 'mongo'
        }, function() {
          assert(mongoProviderProxy.init.calledWithMatch({
            config: { url: sinon.match.string }
          }));
          return done();
        });
      });
    });
  });
});