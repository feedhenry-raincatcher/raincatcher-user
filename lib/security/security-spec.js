var assert = require('assert');
var sampleUserProfileData = require('../../test/fixtures/sampleUserProfile.json');
var aes = require('./aes.js');
var sha256 = require('./sha256.js');
var sampleSecurityeData = require('../../test/fixtures/sampleSecurityData.json');

describe("Test Data Encyption, Hashing and Decryption", function() {
  it('should error when you try to hash a null value', function(done) {
    return sha256.hash(null).then(function(response) {
      assert(!response, "Should not contain a hash value,");
    }).then(done).catch(function(err) {
      assert(err, "should contain an error.");
      done();
    });
  });

  it('should respond with a correct hash when you try to hash a string value', function(done) {
    sha256.hash(sampleSecurityeData.plaintext).then(function(response) {
      assert.equal(response, sampleSecurityeData.plaintextSha256);
    }).then(done);
  });

  it('should error when you try to encrypt using a null data value', function(done) {
    aes.encrypt(null, sampleSecurityeData.aesKey).then(function() {
      done(new Error('It should not try to encrypt using a null data value'));
    }, function(err) {
      assert(err, "should contain an error.");
      done();
    });
  });

  it('should error when you try to encrypt using a null secret key value', function(done) {
    aes.encrypt(sampleUserProfileData, null).then(function() {
      done(new Error('It should not try to encrypt using a null secret key value'));
    }, function(err) {
      assert(err, "should contain an error.");
      done();
    });
  });

  it('should respond with ciphertext when you try to encrypt a string value', function(done) {
    aes.encrypt(sampleUserProfileData, sampleSecurityeData.aesKey).then(function(response) {
      assert.equal(response.toString().length, sampleSecurityeData.ciphertextLength, "It should match the specified ciphertext length");
    }).then(done).catch(done);
  });

  it('should error when you try to decrypt using a null ciphertext value', function(done) {
    aes.decrypt(null, sampleSecurityeData.aesKey).then(function(response) {
      assert(!response);
    }).then(done).catch(function(err) {
      assert(err);
      done();
    });
  });

  it('should error when you try to decrypt using a null secret key value', function(done) {
    aes.decrypt(sampleUserProfileData, null).then(function(response) {
      assert(!response);
    }).then(done).catch(function(err) {
      assert(err);
      done();
    });
  });

  it('should respond with the correct plaintext when you try to decrypt some ciphertext', function(done) {
    aes.decrypt(sampleSecurityeData.sampleUserProfileDataCiphertext, sampleSecurityeData.aesKey).then(function(response) {
      assert.equal(JSON.stringify(sampleUserProfileData), JSON.stringify(response), "It should match the specified plaintext");
    }).then(done).catch(done);
  });
});
