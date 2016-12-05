/*
 * Checks if a session exists in cache using the session token as an id and returns the session found
 *
 * @params {Object} mbaasApi object which allows access to cache
 * @params {String} sessionToken string that is used as an id for the specified session in cache.
 * @params {Function} cb function callback
 */
function checkSession(mbaasApi, sessionToken, cb) {
  var options = {
    "act": "load",
    "key": sessionToken
  };

  mbaasApi.cache(options, function(err, session) {
    if (err) {
      console.log("Error getting cache value: ", err);
      return cb(err);
    }

    return cb(undefined, session);
  });
}

/*
 * Saves specified session in cache
 *
 * @params {Object} mbaasApi object which allows access to cache
 * @params {String} sessionToken string that is used as an id for the specified session in cache.
 * @params {Object} session object which holds all the session details
 * @params {Function} cb function callback
 */
function saveSession(mbaasApi, sessionToken, session, cb) {
  var options = {
    "act": "save",
    "key": sessionToken,
    "value": session
  };

  mbaasApi.cache(options, function(err) {
    if (err) {
      return cb(err);
    }
    return cb(undefined);
  });
}

module.exports = {
  checkSession: checkSession,
  saveSession: saveSession
};