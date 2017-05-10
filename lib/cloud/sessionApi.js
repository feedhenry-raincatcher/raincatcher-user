var sessionCache = require("./middleware/sessionCache");
var Promise = require("bluebird");
var sessionApi = {};

/**
 * Api for user cache management
 *
 * @param clientMbaasApi
 * @returns {Object} api object
 */
module.exports = function(clientMbaasApi) {
  sessionApi.mbaasApi = clientMbaasApi;
  return sessionApi;
};

/**
 * Retrieves ID of current logged user
 *
 * @param {string} sessionToken session token of the logged user
 */
sessionApi.getUserIdForSession = function(sessionToken) {
  return new Promise(function(resolve, reject) {
    sessionCache.checkSession(sessionApi.mbaasApi, sessionToken, function(err, cachedObj) {
      if (err) {
        return reject(err);
      }
      if (cachedObj && cachedObj.session) {
        var session = JSON.parse(cachedObj.session);
        return resolve(session.userId);
      }
      reject(new Error("No session"));
    });
  });
};


