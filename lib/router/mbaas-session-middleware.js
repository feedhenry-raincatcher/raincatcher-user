const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var _ = require('lodash');
var sessionProviders = require('../config/sessionStorageProviders').providers;


/**
* Function to setup express-session and connect-mongo with the configuration sent from the raincatcher-demo-auth application.
* Default configuration options are also provided.
* @param sessionConfig {object} - the configuration for express-session and connect-mongo
* @callback cb - err, session config for connect-mongo
*/
function initSession(sessionConfig, cb) {
  if (!(_.isObject(sessionConfig))) {
    return cb("Error: Session Config is not a valid Object", null);
  }

  if (sessionConfig && !(sessionProviders.indexOf(sessionConfig.store) > -1)) {
    return cb("Error: Session Storage Provider is not supported.", null);
  }

  console.log("Using mongo session store");

    // don't allow store to be overwritten since it needs to be defined here
  var expressSessionConfig = _.defaults(sessionConfig, {
    store: MongoStore,
    config: {
      secret: process.env.FH_COOKIE_SECRET || 'raincatcher',
      host: '127.0.0.1',
      port: '27017',
      db: 'session',
      url: 'mongodb://localhost:27017/raincatcher-demo-auth-session-store',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV !== 'development',
        httpOnly: true,
        path: '/'
      }
    }
  });

  var config = {session: session, options: expressSessionConfig, store: new MongoStore(expressSessionConfig.config)};
  return cb(null, config);
}


function isSessionValid(req, res, next) {
  if (req.sessionID) {
    // check if session is valid
    return next();
  }
  // session not valid
  res.redirect('/');
}

module.exports = {
  isSessionValid: isSessionValid,
  initSession: initSession
};
