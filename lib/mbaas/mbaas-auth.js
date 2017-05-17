const q = require('q');
const _ = require('lodash');

/**
 * Auth sends a request on 'wfm:user:auth' topic, raincatcher-demo-auth is subscriber
 * of this topic and verifies passed in credentials.
 *
 * @param {Object} mediator object used to subscribe and publish read and auth topics
 * @param {String} userIdentifier Unique identifier of the user.
 * @param {String} password passed in password to be verified against user.
 *
 */
exports.auth = function(mediator, userIdentifier, password) {

  /**
   * Returns promise with user profile for authenticated user, or an error
   * if user doesn't exist or is not authenticated.
   *
   * @param {boolean} authenticated
   * @returns {*|promise} containing user profile for authenticated user.
   */
  function checkAuthentication(authenticated) {
    //If the authentication failed, the return an error.
    if (!authenticated) {
      var checkAuthDeferred = q.defer();
      checkAuthDeferred.reject(new Error('Invalid Credentials'));
      return checkAuthDeferred.promise;
    }

    //If the authentication response is an object, respond with that.
    if (_.isObject(authenticated)) {
      return authenticated;
    }

    //Otherwise, read the user.
    return mediator.request('wfm:user:username:read', userIdentifier);
  }

  // this will return true/false result of verification or User not found error
  return mediator.request('wfm:user:auth', {username: userIdentifier, password: password}, {uid: userIdentifier})
    .then(checkAuthentication);
};
