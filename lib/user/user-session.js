var express = require('express')
  , config = require('./config-user')
  , Delegate = require('./user-delegate');

function initRouter(delegate) {
  var router = express.Router();

  router.route('/auth').post(function(req, res, next) {
    var params = req && req.body && req.body.params;
    delegate.auth(params).then(function(data) {
      res.json(data);
    }, function(error) {
      next(error);
    });
  });

  router.route('/verifysession').post(function(req, res, next) {
    delegate.verifysession().then(function(data) {
      res.json(data);
    }, function(error) {
      next(error);
    });
  });

  router.route('/revokesession').post(function(req, res, next) {
    delegate.revokesession().then(function(data) {
      res.json(data);
    }, function(error) {
      next(error);
    });
  });

  return router;
}

module.exports = function(mediator, app, guid) {
  var self = this;
  self.mediator - mediator;

  var delegate = new Delegate(guid);
  var router = initRouter(delegate);
  app.use(config.authpolicyPath, router);

  mediator.subscribe('wfm:session:validate', function(sessId) {
    return delegate.verifysession(sessId)
      .then(function() {
        self.mediator.publish('done:' + 'wfm:session:validate');
      })
      .catch(function(err) {
        self.mediator.publish('error:' + 'wfm:session:validate', err);
      });
  });
};
