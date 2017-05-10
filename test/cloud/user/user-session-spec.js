var mockMbaasServiceProxy = require('../../../test/stub/mbaas-service-proxy');
var mediator = require('fh-wfm-mediator/lib/mediator');
var express = require('express');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var assert = require('assert');

var sessionManager;

describe("User Sessions", function() {
  var verifySessionStub;

  beforeEach(function() {
    verifySessionStub = mockMbaasServiceProxy.getMockVerifySessionStub();
    sessionManager = proxyquire('./user-session', {
      './mbaas-service-proxy': mockMbaasServiceProxy.getMockSessionObject(verifySessionStub)
    });
    sessionManager(mediator, express(), 'my-service-name-guid');
  });

  it("Testing valid session token", function() {
    return mediator.request('wfm:user:session:validate', 'myvalidsessiontoken').then(function(validationResponse) {
      sinon.assert.calledOnce(verifySessionStub);
      assert(validationResponse.isValid === true);
    });
  });

  it("Testing invalid session token", function() {
    return mediator.request('wfm:user:session:validate', 'myinvalidsessiontoken').then(function(validationResponse) {
      sinon.assert.calledOnce(verifySessionStub);
      assert(validationResponse.isValid === false);
    });
  });
});