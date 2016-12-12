'use strict';

var express = require('express')
  , config = require('./config-user')
  , MbaasServiceProxy = require('./mbaas-service-proxy');

function initRouter(msProxy) {
  var router = express.Router();

  router.route('/').get(function(req, res, next) {
    msProxy.list().then(function(users) {
      res.json(users);
    }, function(error) {
      next(error);
    });
  });
  router.route('/config/authpolicy').get(function(req, res) {
    res.json(config.policyId);
  });
  router.route('/:id').get(function(req, res, next) {
    msProxy.read(req.params.id).then(function(user) {
      res.json(user);
    }, function(error) {
      next(error);
    });
  });
  router.route('/:id').put(function(req, res, next) {
    msProxy.update(req.body).then(function(user) {
      res.json(user);
    }, function(error) {
      next(error);
    });
  });
  router.route('/').post(function(req, res, next) {
    msProxy.create(req.body).then(function(user) {
      res.json(user);
    }, function(error) {
      next(error);
    });
  });
  router.route('/:id').delete(function(req, res, next) {
    console.log('delete');
    msProxy.delete(req.body).then(function(user) {
      console.log('delete success');
      res.json(user);
    }, function(error) {
      console.error(error);
      next(error);
    });
  });

  return router;
}

/**
 * Route User requests to config.apiPath endpoint
 * @param app cloud application
 * @param guid
 */
module.exports = function(app, guid) {
  var msProxy = new MbaasServiceProxy(guid);
  var router = initRouter(msProxy);
  app.use(config.apiPath, router);
};
