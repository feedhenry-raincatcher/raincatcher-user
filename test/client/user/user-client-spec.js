var assert = require('assert');
var sinon = require('sinon');
var chai = require('chai');
var userClientMock = require('../../../test/mocks/user-client-mock');
var sampleUserProfileData = require('../../../test/fixtures/sampleUserProfile.json');
var sampleSecurityData = require('../../../test/fixtures/sampleSecurityData.json');

var UserClient = require('./user-client');
var mediator = require('fh-wfm-mediator/lib/mediator');

describe("Test Storage/Retrieval of Profile Data", function() {

  it('Should return ciphertext when the profile data and the session token are valid', function() {
    var testEncrypt = userClientMock.storeProfile(sampleUserProfileData, sampleSecurityData.sessionToken);
    sinon.assert.calledWith(userClientMock.storeProfile, sampleUserProfileData, sampleSecurityData.sessionToken);
    assert.equal(false, (testEncrypt instanceof Error), 'Should not return an error.');
  });

  it('Should not attempt Encyption when the profileData is null', function() {
    assert.throws( function() {
      userClientMock.storeProfile(null, sampleSecurityData.sessionToken);
    }, Error );
    sinon.assert.calledWith(userClientMock.storeProfile, null, sampleSecurityData.sessionToken);
  });

  it('Should not attempt Encyption when the sessionToken is null', function() {
    assert.throws( function() {
      userClientMock.storeProfile(sampleUserProfileData, null);
    }, Error );
    sinon.assert.calledWith(userClientMock.storeProfile, sampleUserProfileData, null);
  });

  it('Should not attempt Encyption when both the profileData and the sessionToken are null', function() {
    assert.throws( function() {
      userClientMock.storeProfile(null, null);
    }, Error );
    sinon.assert.calledWith(userClientMock.storeProfile, null, null);
  });

});


describe("Test Cacheing Authentication Responses", function() {


  var userClient;
  var cloudStub = sinon.stub().callsArg(1);
  var fhInitStub = sinon.stub().callsArg(1);

  var getFHParamsStub = sinon.stub().returns({appId: "someappid"});

  before(function() {

    $fh = {
      cloud: cloudStub,
      on: fhInitStub,
      getFHParams: getFHParamsStub
    };

    localStorage = {
      setItem: sinon.stub(),
      clear: sinon.stub()
    };

    var documentEventListenerStub = sinon.stub();
    documentEventListenerStub.withArgs(sinon.match('resume'), sinon.match.func).callsArg(1);


    document = {
      addEventListener: documentEventListenerStub
    };

    userClient = UserClient(mediator);
  });

  it("should cache an authenticated session", function() {

    var authStub = sinon.stub().callsArgWith(1, {sessionToken: "somesessiontoken", authResponse: sampleUserProfileData});

    $fh.auth = authStub;

    chai.expect(userClient.userVerified).to.equal(false);

    return userClient.auth("someusername", "somepassword").then(function() {
      sinon.assert.calledOnce(authStub);
      chai.expect(userClient.userVerified).to.equal(true);
    });
  });

  it("should reset the cached verified when the session is cleared", function() {

    $fh.cloud = sinon.stub().callsArgWith(1);

    return userClient.clearSession().then(function() {
      sinon.assert.calledOnce($fh.cloud);
      sinon.assert.calledWith($fh.cloud, sinon.match({
        method: sinon.match("POST"),
        path: sinon.match("/box/srv/1.1/admin/authpolicy/revokesession"),
        body: sinon.match.object
      }), sinon.match.func, sinon.match.func);
      chai.expect(userClient.userVerified).to.equal(false);
    });
  });

});