var _ = require('lodash');
var hash = require('./hash');
var q = require('q');
q.longStackSupport = process.env.NODE_ENV === 'development';

var verifyErrMessage = 'User not found with supplied credentials';
var simpleStore = require('fh-wfm-simple-store');

function stripPassword(user) {
  user = _.cloneDeep(user);
  if (user.password) {
    delete user.password;
  }

  return user;
}

function hashUserPassword(user, pwd) {
  return q.nfcall(hash.saltAndHash, pwd).then(function(hashed) {
    user.password = hashed;
    return user;
  });
}

function decorateStore(Store) {
  const origCreate = Store.prototype.create;
  const origUpdate = Store.prototype.update;
  const origRead = Store.prototype.read;
  const origListen = Store.prototype.listen;

  Store.prototype.create = function(user) {
    user = _.cloneDeep(user);
    return hashUserPassword(user, user.password)
    .then(origCreate.bind(this))
    .then(stripPassword);
  };

  Store.prototype.read = function(id) {
    return origRead.call(this, id).then(function(user) {
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    });
  };

  Store.prototype.findByUsername = function(username) {
    return this.list({
      key: 'username',
      value: username
    }).then(_.first);
  };

  /**
   * Finds a user by username.
   */
  Store.prototype.byUsername = function(username) {
    return this.findByUsername(username, this.data)
    .then(stripPassword);
  };

  /**
   * Updates an user's data, searching by the ID field. The ID field is read-only.
   * Also updates the user's password unconditionally,
   * so this function should only be acessible from a trusted application.
   * @param  {Object} user User data to update
   * @return {Promise}      Promise that resolves to the updated user
   */
  Store.prototype.update = function(user) {
    var passwordPromise = user.password ? hashUserPassword(user, user.password) : q(user);
    return passwordPromise
    .then(origUpdate.bind(this))
    .then(stripPassword);
  };

  /**
   * Update's a user's password when also given the current password
   * @param  {String} username
   * @param  {String} oldPwd   The user's current password
   * @param  {String} newPwd   The desired new password for the user
   * @return {Promise}          Promise that resolves to the updated user when successful
   * or rejects if the user is not found or the current password does not match.
   * Note that the password field is not readable
   */
  Store.prototype.updatePassword = function(username, oldPwd, newPwd) {
    var user;
    return this.findByUsername(username).then(function(found) {
      return user = found;
    })
    .then(_.partial(doVerify, oldPwd))
    .then(function(match) {
      if (!match) {
        return q.reject(new Error());
      }
      // old password matches, update to new password
      user.password = newPwd;
      return user;
    })
    .then(this.update.bind(this))
    .then(stripPassword)
    .catch(function() {
      return q.reject(new Error(verifyErrMessage));
    });
  };

  function doVerify(password, user) {
    // user.password here should be the stored hash
    return q.nfcall(hash.verify, password, user.password).then(function(match) {
      if (!match) {
        throw new Error(verifyErrMessage);
      } else {
        return true;
      }
    });
  }

  /**
   * Verifies if the user with the given username has the supplied password.
   * @param  {String} username
   * @param  {String} password
   * @return {Promise}          A promise that resolves to a boolean of whether the password matches,
   * the promise is also rejected if the user is not found or the password does not match
   */
  Store.prototype.verifyPassword = function(username, password) {
    return this.findByUsername(username)
    .then(function(user) {
      return q.delay(user, 500);
    })
    .then(_.partial(doVerify, password))
    .catch(function() {
      return q.reject(new Error(verifyErrMessage));
    });
  };


  Store.prototype.listen = function(topicPrefix, mediator) {
    var self = this;
    origListen.call(this, topicPrefix, mediator);
    this.topics
    .on('username:read', function(username) {
      return self.byUsername(username);
    })
    .on('auth', function(data) {
      return self.verifyPassword(data.username, data.password);
    })
    .on('password',  function(data) {
      return self.updatePassword(data.username, data.oldPwd, data.newPwd);
    });
  };
}

module.exports = function initializeUserStoreClass(config) {
  var Store = simpleStore(config);
  decorateStore(Store);
  return Store;
};