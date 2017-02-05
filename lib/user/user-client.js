'use strict';

var q = require('q');
var _ = require('lodash');
var config = require('./config-user');
var aes = require('../security/aes');
var sha256 = require('../security/sha256');
var policyId;

var UserClient = function(mediator) {
  this.mediator = mediator;
  this.initComplete = false;
  this.initPromise = this.init();
};

var xhr = function(_options) {
  var defaultOptions = {
    path: '/',
    method: 'get',
    contentType: 'application/json'
  };
  var options = _.defaults(_options, defaultOptions);
  var deferred = q.defer();
  $fh.cloud(options, function(res) {
    deferred.resolve(res);
  }, function(message, props) {
    var e = new Error(message);
    e.props = props;
    deferred.reject(e);
  });
  return deferred.promise;
};

/**
* Encrypt the users profile data using AES with a hash of the session key and store the result in localStorage.
* @param profileData {object} - the plaintext to encrypt.
* @param sessionToken {string} - the secret key to encrypt with.
*/
var storeProfile = function(profileData, sessionToken) {
  if (sessionToken && profileData) {

    var hashedSessionKey = sha256.hash(sessionToken);
    var encryptedData = aes.encrypt(profileData, hashedSessionKey);

    // set the encrypted data in localStorage
    localStorage.setItem('fh.wfm.profileData', encryptedData);

  } else {
    console.log("Session Token or Profile Data is Null. Setting profile data to null.");
    localStorage.setItem('fh.wfm.profileData', null);
  }
};


/**
* Decrypt the users profile data using AES with a hash of the session key.
* @returns object/null
*/
var retrieveProfileData = function() {
  var decryptedProfileData;
  if (localStorage.getItem('fh_session_token.sessionToken') && localStorage.getItem('fh.wfm.profileData')) {
    var ciphertext = localStorage.getItem('fh.wfm.profileData');
    var sessionToken = JSON.parse(localStorage.getItem('fh_session_token.sessionToken')).sessionToken;
    var hashedSessionKey = sha256.hash(sessionToken);
    decryptedProfileData = aes.decrypt(ciphertext, hashedSessionKey);
  } else {
    console.log("Session Token or Profile Data is Null, Cannot Retrieve Profile Data.");
  }
  return decryptedProfileData;

};

UserClient.prototype.init = function() {
  var deferred = q.defer();
  var self = this;
  $fh.on('fhinit', function(error) {
    if (error) {
      deferred.reject(new Error(error));
      return;
    }
    self.appid = $fh.getFHParams().appid;
    self.initComplete = true;
    deferred.resolve();
  });
  var promiseConfig = xhr({
    path: config.apiPath + '/config/authpolicy'
  }).then(function(_policyId) {
    policyId = _policyId;
    return policyId;
  });
  return q.all([deferred.promise, promiseConfig]);
};

UserClient.prototype.list = function() {
  return xhr({
    path: config.apiPath
  });
};

UserClient.prototype.read = function(id) {
  return xhr({
    path: config.apiPath + '/' + id
  });
};

UserClient.prototype.update = function(user) {
  return xhr({
    path: config.apiPath + '/' + user.id,
    method: 'put',
    data: user
  });
};

UserClient.prototype.delete = function(user) {
  return xhr({
    path: config.apiPath + '/' + user.id,
    method: 'delete',
    data: user
  });
};

UserClient.prototype.create = function(user) {
  return xhr({
    path: config.apiPath,
    method: 'post',
    data: user
  });
};

UserClient.prototype.auth = function(username, password) {
  var deferred = q.defer();
  var self = this;
  this.initPromise.then(function() {
    $fh.auth({
      policyId: policyId,
      clientToken: self.appid,
      params: {
        userId: username,
        password: password
      }
    }, function(res) {
      // res.sessionToken; // The platform session identifier
      // res.authResponse; // The authetication information returned from the authetication service.
      var sessionToken = res.sessionToken;
      var profileData = res.authResponse;
      if (typeof profileData === 'string' || profileData instanceof String) {
        try {
          profileData = JSON.parse(profileData);
        } catch (e) {
          console.error(e);
          console.log('Unable to parse the $fh.auth response. Using a workaround');
          profileData = JSON.parse(profileData.replace(/,\s/g, ',').replace(/[^,={}]+/g, '"$&"').replace(/=/g, ':'));
        }
      }
      storeProfile(profileData, sessionToken);
      self.mediator.publish('wfm:auth:profile:change', profileData);
      deferred.resolve(res);

    }, function(msg, err) {
      console.log(msg, err);
      var errorMsg = err.message;
      /* Possible errors:
      unknown_policyId - The policyId provided did not match any defined policy. Check the Auth Policies defined. See Auth Policies Administration
      user_not_found - The Auth Policy associated with the policyId provided has been set up to require that all users authenticating exist on the platform, but this user does not exists.
      user_not_approved - - The Auth Policy associated with the policyId provided has been set up to require that all users authenticating are in a list of approved users, but this user is not in that list.
      user_disabled - The user has been disabled from logging in.
      user_purge_data - The user has been flagged for data purge and all local data should be deleted.
      device_disabled - The device has been disabled. No user or apps can log in from the requesting device.
      device_purge_data - The device has been flagged for data purge and all local data should be deleted.
      */
      if (errorMsg === "user_purge_data" || errorMsg === "device_purge_data") {
        // TODO: User or device has been black listed from administration console and all local data should be wiped
        console.log('User or device has been black listed from administration console and all local data should be wiped');
      } else {
        console.log("Authentication failed - " + errorMsg);
        deferred.reject(errorMsg);
      }
    });
  });
  return deferred.promise;
};

UserClient.prototype.hasSession = function() {
  var deferred = q.defer();
  $fh.auth.hasSession(function(err, exists) {
    if (err) {
      console.log('Failed to check session: ', err);
      deferred.reject(err);
    } else if (exists) {
      //user is already authenticated
      //optionally we can also verify the session is acutally valid from client. This requires network connection.
      deferred.resolve(true);
    } else {
      deferred.resolve(false);
    }
  });
  return deferred.promise;
};

UserClient.prototype.clearSession = function() {
  var deferred = q.defer();
  var self = this;
  $fh.auth.clearSession(function(err) {
    if (err) {
      console.log('Failed to clear session: ', err);
      deferred.reject(err);
    } else {
      self.mediator.publish('wfm:auth:profile:change', null);
      localStorage.clear();
      deferred.resolve(true);
    }
    return deferred.promise;
  });
};

UserClient.prototype.verify = function() {
  var deferred = q.defer();
  $fh.auth.verify(function(err, valid) {
    if (err) {
      console.log('failed to verify session');
      deferred.reject(err);
      return;
    } else if (valid) {
      console.log('session is valid');
      deferred.resolve(true);
    } else {
      console.log('session is not valid');
      deferred.resolve(false);
    }
  });
  return deferred.promise;
};

UserClient.prototype.getProfile = function() {
  return q.when(retrieveProfileData());
};

module.exports = function(mediator) {
  return new UserClient(mediator);
};