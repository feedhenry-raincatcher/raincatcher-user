var mockMbaasServiceProxy = require('./stub/mbaas-service-proxy');
var mediator = require('fh-wfm-mediator/lib/mediator');
var express = require('express');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var assert = require('assert');

var sessionManager;

describe("Mbaas Service Proxy", function() {
  var verifySessionStub;

  beforeEach(function() {

    verifySessionStub = mockMbaasServiceProxy.getMockVerifySessionStub();
    sessionManager = proxyquire('./user-session', {
      './mbaas-service-proxy': mockMbaasServiceProxy.getMockSessionObject(verifySessionStub)
    });
    sessionManager(mediator, express(), 'service-name-guid1');
  });

  it("Testing valid session token", function(done) {

    mediator.request('wfm:user:session:validate', 'myvalidsessiontoken', function(err, validationResponse) {
      sinon.assert.calledOnce(verifySessionStub);
      assert.ok(!err, 'Error on myvalidsessiontoken' + err);
      assert(validationResponse.isValid === true);
      done();
    });
  });

  it("Testing invalid session token", function(done) {

    sessionManager(mediator, express(), 'service-name-guid2');
    mediator.request('wfm:user:session:validate', 'myinvalidsessiontoken', function(err, validationResponse) {
      sinon.assert.calledOnce(verifySessionStub);
      assert.ok(!err, 'Error on myinvalidvalidsessiontoken' + err);
      assert(validationResponse.isValid === true);
      done();
    });
  });
});