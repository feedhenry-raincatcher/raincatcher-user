var sinon = require('sinon');
require('sinon-as-promised');
var sampleSecurityData = require('../../../test/fixtures/sampleSecurityData.json');

/**
* Simple function to mock the logic for profile data encryption without using phantom/jsdom to mock localstorage interactions.
* The tests for the underlying security functionality is found in lib/security
* @param profileData - the users profile data
* @param sessionToken - the users sessionToken
*/
function storeProfileStub(profileData, sessionToken) {
  var stub = sinon.stub();
  if (profileData === null || sessionToken === null) {
    stub.rejects(new Error("Session Token or Profile Data is Null. Setting profile data to null."));
  } else {
    // return some ciphertext
    stub.resolves(sampleSecurityData.sampleUserProfileDataCiphertext);
  }
  return stub;
}

module.exports = {
  storeProfile: storeProfileStub()
};
