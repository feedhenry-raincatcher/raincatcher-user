var CryptoJS = require("crypto-js");
var q = require('q');

/**
* Generate a SHA256 hash value for some given text.
* @param text - the text to generate a hash value for,
*/
function hash(text) {
  var deferred = q.defer();
  if (text === null) {
    deferred.reject(new Error("Text to hash is Null."));
  } else {
    var hash = CryptoJS.SHA256(text);
    deferred.resolve(hash.toString(CryptoJS.enc.Base64));
  }
  return deferred.promise;
}

module.exports = {
  hash: hash
};
