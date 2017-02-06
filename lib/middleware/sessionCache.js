var config = require('../user/config-user');

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
  
  mbaasApi.cache(options, function(err, session){
    if(err){
      return cb(err);
    }
    return cb(err, JSON.parse(session));
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
    "expire": config.sessionTokenExpiry,
    "value": JSON.stringify(session)
  };

  mbaasApi.cache(options, function(err) {
    return cb(err, session);
  });
}

module.exports = {
  checkSession: checkSession,
  saveSession: saveSession
};