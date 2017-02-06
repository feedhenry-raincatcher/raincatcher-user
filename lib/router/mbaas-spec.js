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
var sampleUserData = require('./fixtures/user');
var sinon = require('sinon');
var should = require('chai').should();

var sampleExclusionList1 = ['banner'];
var sampleExclusionList2 = ['banner', 'avatar'];
var sampleExclusionList3 = [];
var sampleExclusionList4 = undefined;
var sampleExclusionList5 = null;

describe('Test MBaaS Router', function() {
  var app, request;

  beforeEach(function(done) {
    mediatorMock.request.reset();
    app = express();
    app.use(bodyParser.json());
    request = supertest(app);
    mbaasRouter.init(mediatorMock, app, [], {}, done);
  });

  it('Should return a list of Users', function(done) {
    request
      .get('/api/wfm/user/')
      .send()
      .expect(200, function(err, res) {
        assert.ok(!err, err);
        assert.ok(res, "Expected a result from the user list request.");
        done();
      });
  });

  it('Should Read a User when the User ID exists', function(done) {
    request
      .get('/api/wfm/user/' + sampleUserData.validUserIds[0])
      .send(sampleUserData.validUserIds[0])
      .expect(200, function(err, res) {
        assert.equal(res.body.id, sampleUserData.sampleUser.id, "Expected that the returned user data contained the correct user id.");
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:read', sampleUserData.validUserIds[0]);
        done();
      });
  });

  it('Should throw an error when there is an issue getting a user by id', function(done) {
    request
      .get('/api/wfm/user/' + sampleUserData.invalidUserIds[0])
      .send(sampleUserData.invalidUserIds[0])
      .expect(500, function(err, res) {
        should.not.exist(res.body.id, "Expected a user to not be returned.");
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:read', sampleUserData.invalidUserIds[0]);
        done();
      });
  });

  it('Should Update a User when the User ID exists and the Profile Data is valid', function(done) {
    request
      .put('/api/wfm/user/' + sampleUserData.validUserIds[0])
      .send(sampleUserData.sampleUser, {uid: sampleUserData.validUserIds[0]})
      .expect(200, function(err, res) {
        assert.equal(res.body.id, sampleUserData.sampleUserUpdate.id, "Expected the correct user to be return after the update.");
        assert.equal(res.body.position, sampleUserData.sampleUserUpdate.position, "Expected the position field to be updated.");
        assert.equal(res.body.notes, sampleUserData.sampleUserUpdate.notes, "Expected the notes field to be updated.");
        done();
      });
  });

  it('Should Not Update a User when the User ID doesnt exist', function(done) {
    request
      .put('/api/wfm/user/' + sampleUserData.invalidUserIds[0])
      .send(sampleUserData.sampleUser, {uid: sampleUserData.invalidUserIds[0]})
      .expect(500, function(err, res) {
        should.not.exist(res.body.id, "Expected a user to not be returned.");
        sinon.assert.calledOnce(mediatorMock.request);
        done();
      });
  });

  it('Should Create a new User when the Profile Data is valid', function(done) {
    request
      .post('/api/wfm/user/')
      .send({user: sampleUserData.sampleUser})
      .expect(200, function(err, res) {
        assert.equal(res.body.id, sampleUserData.sampleUser.id, "Expected the created user to be return after the correct.");
        assert.equal(res.body.position, sampleUserData.sampleUser.position, "Expected the position field to be correct.");
        assert.equal(res.body.notes, sampleUserData.sampleUser.notes, "Expected the notes field to be correct.");
        done();
      });
  });

  it('Should not Create a new User when the Profile Data is invalid', function(done) {
    request
        .post('/api/wfm/user/')
        .send({user: sampleUserData.invalidUserProfile})
        .expect(500, function(err, res) {
          should.not.exist(res.body.id, "Expected a user to not be returned.");
          done();
        });
  });

  it('Should Delete a User when the User exists', function(done) {
    request
      .delete('/api/wfm/user/' + sampleUserData.validUserIds[0])
      .send(sampleUserData.validUserIds[0])
      .expect(200, function(err, res) {
        assert.equal(res.body.id, sampleUserData.sampleUser.id, "Expected that the returned user data contained the correct user id.");
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:delete', sampleUserData.validUserIds[0]);
        done();
      });
  });

  it('Should Not Delete a User when the User does not exist', function(done) {
    request
      .delete('/api/wfm/user/' + sampleUserData.invalidUserIds[0])
      .send(sampleUserData.invalidUserIds[0])
      .expect(500, function(err, res) {
        should.not.exist(res.body.id, "Expected a user to not be returned.");
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:delete', sampleUserData.invalidUserIds[0]);
        done();
      });
  });


});




describe('Test mbass authentication', function() {
  var app, request;

  beforeEach(function(done) {
    mediatorMock.request.reset();
    app = express();
    app.use(bodyParser.json());
    request = supertest(app);
    mbaasRouter.init(mediatorMock, app, [], {}, done);
  });

  it('Should log in using correct credentials', function(done) {
    request
      .get('/api/wfm/user/auth')
      .send({userId: sampleUserData.sampleUser.username, password: sampleUserData.sampleUser.password})
      .expect(200, function(err, res) {
        assert.ok(!err, err);
        assert.ok(res, "Expected a result from the authentication request.");
        assert.equal(res.body.status, 'ok',
          "Expected status ok from the successful authentication request.");
        assert.equal(res.body.userId, sampleUserData.sampleUser.username,
          "Expected user profile from the successful authentication request.");
        sinon.assert.calledTwice(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:auth',
          {username: sampleUserData.sampleUser.username, password: sampleUserData.sampleUser.password});
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:username:read',
          sampleUserData.sampleUser.username);
        done();
      });
  });

  it('Should get 401 User not found when logging in with incorrect username', function(done) {
    request
      .get('/api/wfm/user/auth')
      .send({userId: 'invalid_username', password: sampleUserData.sampleUser.password})
      .expect(401, function(err, res) {
        assert.ok(!err, err);
        assert.ok(res, "Expected a result from the failed authentication request.");
        assert.equal(res.body, 'Invalid Credentials',
          'Expected Invalid credentials message in response body on unsuccessful authentication request.');
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:auth',
          sinon.match({
            username: sinon.match(function(username) {
              return username !== sampleUserData.sampleUser.username;
            }),
            password: sinon.match(sampleUserData.sampleUser.password)
          }));
        done();
      });
  });

  it('Should get 401 Invalid credentials when logging in with incorrect password', function(done) {
    request
      .get('/api/wfm/user/auth')
      .send({userId: sampleUserData.sampleUser.username, password: 'invalid_password'})
      .expect(401, function(err, res) {
        assert.ok(!err, err);
        assert.ok(res, "Expected a result from the authentication request.");
        assert.equal(res.body, 'Invalid Credentials',
          'Expected Invalid credentials message in response body on unsuccessful authentication request.');
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:auth',
          sinon.match({
            username: sinon.match(sampleUserData.sampleUser.username),
            password: sinon.match(function(password) {
              return password !== sampleUserData.sampleUser.password;
            })
          }));

        done();
      });
  });
});

describe('#testAuthResponseData', function() {
  it('it should not remove any fields when an empty exclusion list is specified', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList3);
    assert(Object.keys(authResponse).length === sampleProfileDataLength,
      "Expect that specifying an empty exclusion list returns all the User fields in the response.");
    done();
  });

  it('it should remove the password field by default', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleUserConfig.authResponseExclusionList);
    assert(authResponse.password === undefined,
      "Check that the Password field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength,
      "Expect that the auth response has a different length to the user profile data.");
    done();
  });

  it('it should remove a single field when specified', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList1);
    assert(authResponse.banner === undefined,
      "Check that the Banner field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength,
      "Expect that the auth response has a different length to the user profile data.");
    done();
  });

  it('it should remove a single field when specified and also not remove the password', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList1);
    assert(authResponse.banner === undefined,
      "Check that the Banner field has been removed from the Response.");
    assert(authResponse.password !== undefined,
      "Check that the Password field has Not been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength,
      "Expect that the auth response has a different length to the user profile data.");
    done();
  });

  it('it should remove a number of fields when specified', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList2);
    assert(authResponse.banner === undefined,
      "Check that the Banner field has been removed from the Response.");
    assert(authResponse.avatar === undefined,
      "Check that the Avatar field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength,
      "Expect that the auth response has a different length to the user profile data.");
    done();
  });

  it('it should remove the password field by default when the exclusion list is undefined', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList4);
    assert(authResponse.password === undefined,
      "Check that the Password field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength,
      "Expect that specifying an undefined exclusion list will result in the default exclusion list being used");
    done();
  });

  it('it should remove the password field by default when the exclusion list is null', function(done) {
    var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList5);
    assert(authResponse.password === undefined,
      "Check that the Password field has been removed from the Response.");
    assert(Object.keys(authResponse).length !== sampleProfileDataLength,
      "Expect that specifying a null exclusion list will result in the default exclusion list being used.");
    done();
  });
});
