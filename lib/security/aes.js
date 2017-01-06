var CryptoJS = require("crypto-js");
var q = require('q');

/**
* Encrypt an Object using AES with a specified secret key.
* @param data - the data to encrypt.
* @param key - the secret key to encrypt with.
*/
function encrypt(data, key) {
  var deferred = q.defer();

  if (data === null || key === null) {
    deferred.reject(new Error("Data or Secret key is Null."));
  } else {
    var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), key);
    deferred.resolve(ciphertext);
  }
  return deferred.promise;
}

/**
* Decrypt some ciphertext using AES with a specified secret key.
* @param ciphertext - the ciphertext to decrypt.
* @param key - the secret key to decrypt with.
*/
function decrypt(ciphertext, key) {
  var deferred = q.defer();

  if (ciphertext === null || key === null) {
    deferred.reject(new Error("Ciphertext or Secret key is Null."));
  } else {
    var bytes  = CryptoJS.AES.decrypt(ciphertext.toString(), key);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    deferred.resolve(decryptedData);
  }
  return deferred.promise;
}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt
};
