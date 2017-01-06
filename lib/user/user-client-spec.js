var assert = require('assert');
var userClientMock = require('./mocks/user-client-mock');
var sinon = require('sinon');
var sampleUserProfileData = require('../../test/fixtures/sampleUserProfile.json');
var sampleSecurityData = require('../../test/fixtures/sampleSecurityData.json');

describe("Test Storage/Retrieval of Profile Data", function() {

  it('Should return ciphertext when the profile data and the session token are valid', function() {
    return userClientMock.storeProfile(sampleUserProfileData, sampleSecurityData.sessionToken).then(function(result, err) {
      sinon.assert.calledWith(userClientMock.storeProfile, sampleUserProfileData, sampleSecurityData.sessionToken);
      assert.ok(!err, 'Error on valid credentials ' + err);
      assert.ok(result, "Expected a result from the request.");
      assert.equal(result, sampleSecurityData.sampleUserProfileDataCiphertext);
    });
  });

  it('Should not attempt Encyption when the profileData is null', function() {
    return userClientMock.storeProfile(null, sampleSecurityData.sessionToken).then(function(err, result) {
      sinon.assert.calledWith(userClientMock.storeProfile, null, sampleSecurityData.sessionToken);
      assert.ok(!result, "Did not expect a result from the request.");
      assert(err, "should contain an error.");
    });
  });

  it('Should not attempt Encyption when the sessionToken is null', function() {
    return userClientMock.storeProfile(sampleUserProfileData, null).then(function(err, result) {
      sinon.assert.calledWith(userClientMock.storeProfile, sampleUserProfileData, null);
      assert.ok(!result, "Did not expect a result from the request.");
      assert(err, "should contain an error.");
    });
  });

  it('Should not attempt Encyption when both the profileData and the sessionToken are null', function() {
    return userClientMock.storeProfile(null, null).then(function(err, result) {
      sinon.assert.calledWith(userClientMock.storeProfile, null, null);
      assert.ok(!result, "Did not expect a result from the request.");
      assert(err, "should contain an error.");
    });
  });



});
