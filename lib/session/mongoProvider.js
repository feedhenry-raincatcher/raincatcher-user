var MongoClient = require('mongodb').MongoClient;
module.exports = {
  init: function(expressConfig, session, cb) {
    var self = this;
    var MongoStore = require('connect-mongo')(session);
    MongoClient.connect(expressConfig.config.url, function(err, mongo) {
      if (err) {
        return cb(err);
      }
      self.store = new MongoStore({db: mongo});
      self.db = mongo;
      return cb(null);
    });
  },
  verifySession: function(token, cb) {
    //For a given session token, there should only be a maximum of 1
    this.db.collection('sessions').findOne({
      '_id': token
    }, function(err, foundSession) {
      //For the session to be valid, the expiry date must be greater than now.
      var valid = !err && foundSession &&  new Date() < new Date(foundSession.expires);
      return cb(err, valid);
    });
  },
  revokeSession: function(token, cb) {
    this.db.collection('sessions').deleteOne({
      '_id': token
    }, cb);
  },
  defaultConfig: {
    url: 'mongodb://localhost:27017/raincatcher-demo-auth-session-store'
  }
};