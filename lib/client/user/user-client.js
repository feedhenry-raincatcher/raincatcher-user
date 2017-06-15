'use strict';

var q = require('q');
var _ = require('lodash');
var config = require('../../config/config-user');
var aes = require('../../security/aes');
var sha256 = require('../../security/sha256');
var policyId;

var userClient;

var UserClient = function(mediator) {
  this.mediator = mediator;
  this.initComplete = false;
  this.readyPromise = this.ready();
  this.initPromise = this.init();

  //Flag to cache user verification.
  this.userVerified = false;
};

/**
 *
 * Checking for the $fh SDK to be ready before any requests can be made.
 *
 * @returns {*}
 */
UserClient.prototype.ready = function() {
  var self = this;

  return q.Promise(function(resolve, reject) {
    $fh.on('fhinit', function(error) {
      if (error) {
        reject(new Error(error));
        return;
      }
      self.appid = $fh.getFHParams().appid;
      self.initComplete = true;
      resolve();
    });
  });
};

UserClient.prototype.xhr = function(_options) {
  var defaultOptions = {
    path: '/',
    method: 'get',
    contentType: 'application/json',
    timeout: config.clientRequestTimeout
  };
  var options = _.defaults(_options, defaultOptions);
  var deferred = q.defer();

  return this.readyPromise.then(function() {
    $fh.cloud(options, function(res) {
      deferred.resolve(res);
    }, function(message, props) {
      var e = new Error(message);
      e.props = props;
      deferred.reject(e);
    });
    return deferred.promise;
  });
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
  }
  return decryptedProfileData;
};

UserClient.prototype.init = function() {
  var self = this;

  return self.readyPromise.then(function() {
    return self.xhr({
      path: config.apiPath + '/config/authpolicy'
    }).then(function(_policyId) {
      policyId = _policyId;
      return policyId;
    });
  });
};

UserClient.prototype.list = function() {
  return this.xhr({
    path: config.apiPath
  });
};

UserClient.prototype.read = function(id) {
  return this.xhr({
    path: config.apiPath + '/' + id
  });
};

UserClient.prototype.update = function(user) {
  return this.xhr({
    path: config.apiPath + '/' + user.id,
    method: 'put',
    data: user
  });
};

UserClient.prototype.delete = function(user) {
  return this.xhr({
    path: config.apiPath + '/' + user.id,
    method: 'delete',
    data: user
  });
};

UserClient.prototype.create = function(user) {
  return this.xhr({
    path: config.apiPath,
    method: 'post',
    data: user
  });
};

UserClient.prototype.auth = function(username, password) {
  var deferred = q.defer();
  var self = this;

  //There is an attempted login, marking the userVerified flag as false in case the verification fails.
  self.userVerified = false;

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
          profileData = JSON.parse(profileData.replace(/,\s/g, ',').replace(/[^,={}]+/g, '"$&"').replace(/=/g, ':'));
        }
      }

      storeProfile(profileData, sessionToken);
      //Authentication was successful, mark the userVerified flag as true.
      self.userVerified = true;
      self.mediator.publish('wfm:auth:profile:change', profileData);
      deferred.resolve(res);

    }, function(code, errorMsg) {
      /* Possible errors:
      unknown_policyId - The policyId provided did not match any defined policy. Check the Auth Policies defined. See Auth Policies Administration
      user_not_found - The Auth Policy associated with the policyId provided has been set up to require that all users authenticating exist on the platform, but this user does not exists.
      user_not_approved - - The Auth Policy associated with the policyId provided has been set up to require that all users authenticating are in a list of approved users, but this user is not in that list.
      user_disabled - The user has been disabled from logging in.
      user_purge_data - The user has been flagged for data purge and all local data should be deleted.
      device_disabled - The device has been disabled. No user or apps can log in from the requesting device.
      device_purge_data - The device has been flagged for data purge and all local data should be deleted.
      */
      if (typeof errorMsg === 'object') {
        deferred.reject(new Error(code)); //for errors other than the given errors above. i.e. internal errors
      } else {
        deferred.reject(new Error(errorMsg));
      }
    });
  });
  return deferred.promise;
};

UserClient.prototype.hasSession = function() {

  return this.initPromise.then(function() {
    var deferred = q.defer();
    $fh.auth.hasSession(function(err, exists) {
      if (err) {
        deferred.reject(new Error(err));
      } else if (exists) {
        //user is already authenticated
        //optionally we can also verify the session is acutally valid from client. This requires network connection.
        deferred.resolve(true);
      } else {
        deferred.resolve(false);
      }
    });
    return deferred.promise;
  });
};

UserClient.prototype.clearSession = function() {
  var self = this;

  return this.initPromise.then(function() {
    self.userVerified = false;
    return self.xhr({
      path: config.authpolicyPath + "/revokesession",
      method: "POST",
      body: {}
    }).then(function() {
      localStorage.clear();
      self.mediator.publish('wfm:auth:profile:change', null);
    });
  });
};

UserClient.prototype.verify = function(forceVerify) {
  var self = this;

  //If the user has already been verified, then no need to do it again.
  if (this.userVerified && !forceVerify) {
    return q.when(true);
  }

  return this.initPromise.then(function() {
    return self.xhr({
      path: config.authpolicyPath + "/verifysession",
      method: "POST",
      body: {}
    }).then(function(validationResult) {
      self.userVerified = validationResult && validationResult.isValid;
      return self.userVerified;
    });

  });
};

UserClient.prototype.getProfile = function() {
  return q.when(retrieveProfileData());
};

module.exports = function(mediator, config) {
  config = config || {};

  //Only want a single user client per application,
  //If one already exists, use this one.
  if (userClient) {
    return userClient;
  }

  //If the session should be verified every time the app is resumed
  //Then the http request should be sent.
  //Defaults to being turned on.
  if (config.forceSessionVerificationOnResume !== false) {
    document.addEventListener("deviceready", function() {
      document.addEventListener("resume", function() {
        userClient.verify(true).then(function(userVerified) {
          if (!userVerified) {
            userClient.clearSession();
          }
        }).catch(function() {
          userClient.clearSession();
        });
      }, false);
    }, false);
  }

  userClient = new UserClient(mediator);

  return userClient;
};
