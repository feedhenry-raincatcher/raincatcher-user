var assert = require('assert');
var sampleUserProfileData = require('../../test/fixtures/sampleUserProfile.json');
var aes = require('./aes.js');
var sha256 = require('./sha256.js');
var sampleSecurityData = require('../../test/fixtures/sampleSecurityData.json');

describe("Test Data Encyption, Hashing and Decryption", function() {
  it('should error when you try to hash a null value', function() {
    assert.throws(function() {
      sha256.hash(null);
    }, Error );
  });

  it('should respond with a correct hash when you try to hash a string value', function() {
    var hash = sha256.hash(sampleSecurityData.plaintext);
    assert.equal(false, (hash instanceof Error), 'Should not return an error.');
    assert.equal(sampleSecurityData.plaintextSha256, hash, 'Should return the expected hash value.');
  });

  it('should error when you try to encrypt using a null data value', function() {
    assert.throws(function() {
      aes.encrypt(null, sampleSecurityData.aesKey);
    }, Error );
  });

  it('should error when you try to encrypt using a null secret key value', function() {
    assert.throws(function() {
      aes.encrypt(null, sampleSecurityData.sessionToken);
    }, Error );
  });

  it('should respond with ciphertext when you try to encrypt a string value', function() {
    var encrypt = aes.encrypt(sampleSecurityData.plaintext, sampleSecurityData.sessionToken);
    assert.equal("object", (typeof encrypt));
  });

  it('should error when you try to decrypt using a null ciphertext value', function() {
    assert.throws(function() {
      aes.decrypt(null, sampleSecurityData.aesKey);
    }, Error );
  });

  it('should error when you try to decrypt using a null secret key value', function() {
    assert.throws(function() {
      aes.decrypt(sampleUserProfileData, null);
    }, Error );
  });

  it('should respond with the correct plaintext when you try to decrypt some ciphertext', function() {
    var decrypt = aes.decrypt(sampleSecurityData.sampleUserProfileDataCiphertext, sampleSecurityData.aesKey);
    assert.equal(false, (decrypt instanceof Error), 'Should not return an error.');
    assert.equal(JSON.stringify(sampleUserProfileData), JSON.stringify(decrypt), "It should match the specified plaintext");
  });
});