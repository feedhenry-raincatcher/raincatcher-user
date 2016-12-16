var _ = require('lodash');
const assert = require('assert');
const authHandler = require('./mbaas');
const sampleUserConfig = require('../../test/fixtures/sampleUserConfig.json');
const sampleProfileData = require('../../test/fixtures/sampleUserProfile.json');
const sampleProfileDataLength  = Object.keys(sampleProfileData).length;
var mbaasRouter = require('./mbaas');
var express = require('express');
var supertest = require('supertest');
var bodyParser = require('body-parser');
var mediatorMock = require('./mocks/mediatorMock');
var sampleUser = require('./fixtures/user');
var sinon = require('sinon');

var sampleExclusionList1 = ['banner'];
var sampleExclusionList2 = ['banner', 'avatar'];
var sampleExclusionList3 = [];
var sampleExclusionList4 = undefined;
var sampleExclusionList5 = null;

describe('Test mbass authentication', function() {
  var app, request;

  beforeEach(function() {
    mediatorMock.request.reset();
    app = express();
    app.use(bodyParser.json());
    mbaasRouter.init(mediatorMock, app);
    request = supertest(app);

  });

  it('Should log in using correct credentials', function(done) {
    request
      .get('/api/wfm/user/auth')
      .send({userId: sampleUser.username, password: sampleUser.password})
      .expect(200, function(err, res) {
        assert.ok(!err, 'Error on valid credentials ' + err);
        assert.ok(res, "Expected a result from the authentication request.");
        assert.equal(res.body.status, 'ok', "Expected status ok from the successful authentication request.");
        assert.equal(res.body.userId, sampleUser.username, "Expected user profile from the successful authentication request.");
        sinon.assert.calledTwice(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:auth', {username: sampleUser.username, password: sampleUser.password});
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:username:read', sampleUser.username);
        done();
      });
  });

  it('Should get 401 User not found when logging in with incorrect username', function(done) {
    request
      .get('/api/wfm/user/auth')
      .send({userId: 'invalid_username', password: sampleUser.password})
      .expect(401, function(err, res) {
        assert.ok(!err, 'Error on invalid username ' + err);
        assert.ok(res, "Expected a result from the failed authentication request.");
        assert.equal(res.body, 'Invalid Credentials', 'Expected Invalid credentials message in response body on unsuccessful authentication request.');
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:auth',
          sinon.match({
            username: sinon.match(function(username) {
              return username !== sampleUser.username;
            }),
            password: sinon.match(sampleUser.password)
          }));
        done();
      });
  });

  it('Should get 401 Invalid credentials when logging in with incorrect password', function(done) {
    request
      .get('/api/wfm/user/auth')
      .send({userId: sampleUser.username, password: 'invalid_password'})
      .expect(401, function(err, res) {
        assert.ok(!err, 'Error on invalid password ' + err);
        assert.ok(res, "Expected a result from the authentication request.");
        assert.equal(res.body, 'Invalid Credentials', 'Expected Invalid credentials message in response body on unsuccessful authentication request.');
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:auth',
          sinon.match({
            username: sinon.match(sampleUser.username),
            password: sinon.match(function(password) {
              return password !== sampleUser.password;
            })
          }));

        done();
      });
  });
});

describe('#testAuthResponseData', function() {
  it('it should not remove any fields when an empty exclusion list is specified', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList3);
    assert(Object.keys(authResponse).length === sampleProfileDataLength, "Expect that specifying an empty exclusion list returns all the User fields in the response.");
    done();
  });
  it('it should remove the password field by default', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleUserConfig.authResponseExclusionList);
    assert(authResponse.password === undefined, "Check that the Password field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength, "Expect that the auth response has a different length to the user profile data.");
    done();
  });
  it('it should remove a single field when specified', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList1);
    assert(authResponse.banner === undefined, "Check that the Banner field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength, "Expect that the auth response has a different length to the user profile data.");
    done();
  });
  it('it should remove a single field when specified and also not remove the password', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList1);
    assert(authResponse.banner === undefined, "Check that the Banner field has been removed from the Response.");
    assert(authResponse.password !== undefined, "Check that the Password field has Not been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength, "Expect that the auth response has a different length to the user profile data.");
    done();
  });
  it('it should remove a number of fields when specified', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList2);
    assert(authResponse.banner === undefined, "Check that the Banner field has been removed from the Response.");
    assert(authResponse.avatar === undefined, "Check that the Avatar field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength, "Expect that the auth response has a different length to the user profile data.");
    done();
  });
  it('it should remove the password field by default when the exclusion list is undefined', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList4);
    assert(authResponse.password === undefined, "Check that the Password field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength, "Expect that specifying an undefined exclusion list will result in the default exclusion list being used");
    done();
  });
  it('it should remove the password field by default when the exclusion list is null', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList5);
    assert(authResponse.password === undefined, "Check that the Password field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength, "Expect that specifying a null exclusion list will result in the default exclusion list being used.");
    done();
  });
});
