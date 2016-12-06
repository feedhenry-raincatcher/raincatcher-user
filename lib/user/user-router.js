'use strict';

var express = require('express')
  , config = require('./config-user')
  , Delegate = require('./user-delegate');

function initRouter(delegate) {
  var router = express.Router();

  router.route('/').get(function(req, res, next) {
    delegate.list().then(function(users) {
      res.json(users);
    }, function(error) {
      next(error);
    });
  });
  router.route('/config/authpolicy').get(function(req, res) {
    res.json(config.policyId);
  });
  router.route('/:id').get(function(req, res, next) {
    delegate.read(req.params.id).then(function(user) {
      res.json(user);
    }, function(error) {
      next(error);
    });
  });
  router.route('/:id').put(function(req, res, next) {
    delegate.update(req.body).then(function(user) {
      res.json(user);
    }, function(error) {
      next(error);
    });
  });
  router.route('/').post(function(req, res, next) {
    delegate.create(req.body).then(function(user) {
      res.json(user);
    }, function(error) {
      next(error);
    });
  });
  router.route('/:id').delete(function(req, res, next) {
    console.log('delete');
    delegate.delete(req.body).then(function(user) {
      console.log('delete success');
      res.json(user);
    }, function(error) {
      console.error(error);
      next(error);
    });
  });

  return router;
}

module.exports = function(app, guid) {
  var delegate = new Delegate(guid);
  var router = initRouter(delegate);
  app.use(config.apiPath, router);
};
