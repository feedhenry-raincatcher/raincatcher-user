var sessionCache = require('./sessionCache');
var verifySession = require('./verifySession');

/**
 * Middleware which validates session based on session tokens. It first checks cache if session exists,
 * otherwise it publishes to 'wfm:user:session:validate' which verifies the session. If valid, the session
 * is saved in cache.
 *
 * @param {Object} mediator object used to publish topic
 * @param {Object} mbaasApi object used to access sessions in cache
 * @returns {Function} validateSessionMiddleware function to validate session
 */
module.exports = function validateSession(mediator, mbaasApi) {

  return function validateSessionMiddleware(req, res, next) {

    //gets session and session token from fh_params.
    var session = req.fh_params || {__fh: {}};
    var sessionToken = session.__fh.sessiontoken || session.__fh.sessionToken;

    if (!sessionToken) {
      console.log("No session token available");
      return res.status(401).json(new Error("Unauthorized"));
    }

    sessionCache.checkSession(mbaasApi, sessionToken, function(err, sessionFound) {
      if (err) {
        console.log("Error getting cache value: ", err);
        return res.status(500).json(err);
      }

      if (sessionFound) {
        return next();
      }

      verifySession(mediator, mbaasApi, sessionToken, session, function(err, sessionSaved) {
        if (err) {
          return res.status(500).json(err);
        }

        if (!sessionSaved) {
          return res.status(401).json(new Error("Unauthorized"));
        }

        console.log("Successfully saved session in cache");
        return next();
      });
    });

  };
};