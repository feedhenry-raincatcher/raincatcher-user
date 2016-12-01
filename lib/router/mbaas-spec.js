var _ = require('lodash');
const assert = require('assert');
const authHandler = require('./mbaas');
const sampleUserConfig = require('../../test/fixtures/sampleUserConfig.json');
const sampleProfileData = require('../../test/fixtures/sampleUserProfile.json');
const sampleProfileDataLength  = Object.keys(sampleProfileData).length;

var sampleExclusionList1 = ['banner'];
var sampleExclusionList2 = ['banner', 'avatar'];
var sampleExclusionList3 = [];
var sampleExclusionList4 = undefined;
var sampleExclusionList5 = null;


describe('Test Trimming The Authentication Response', function() {
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
    it('it should return all fields when the exclusion list is undefined', function(done) {
      var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList4);
      assert(authResponse.password === undefined, "Check that the Password field has been removed from the Response.");
      assert(Object.keys(authResponse).length !== sampleProfileDataLength, "Expect that specifying an undefined exclusion list will result in the default exclusion list being used");
      done();
    });
    it('it should return all fields when the exclusion list is null', function(done) {
      var authResponse = authHandler.trimAuthResponse(_.clone(sampleProfileData), sampleExclusionList5);
      assert(authResponse.password === undefined, "Check that the Password field has been removed from the Response.");
      assert(Object.keys(authResponse).length !== sampleProfileDataLength, "Expect that specifying a null exclusion list will result in the default exclusion list being used.");
      done();
    });
  });
});
