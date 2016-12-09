'use strict';

var express = require('express')
  , config = require('../user/config-user')
  , _ = require('lodash')
  ;

function initRouter(mediator, authResponseExclusionList) {
  var router = express.Router();

  router.all('/auth', function(req, res) {
    var params = req.body; // params.userId params.password
    if (params && (params.userId || params.username)) {
      var username = params.userId || params.username;
      console.log('Checking credentials for user ' + username);
      mediator.request('wfm:user:username:read', username)
      .then(function(profileData) {
        console.log('Valid credentials for user ' + username);
        // trim the authentication response to remove specified fields
        var authResponse = trimAuthResponse(profileData, authResponseExclusionList);
        res.json({
          status: 'ok',
          userId: username,
          sessionToken: username + '_sessiontoken',
          authResponse: authResponse
        });
      }, function() {
        console.log('Invalid credentials for user ' + username);
        res.status(400);
        res.json({message: 'Invalid credentials'});
      });
    } else {
      console.log('No username provided');
      res.status(400);
      res.json({message: 'Invalid credentials'});
    }
  });

  router.all('/verifysession', function(req, res) {
    res.json({
      isValid: true
    });
  });

  router.all('/revokesession', function(req, res) {
    res.json({});
  });

  router.route('/').get(function(req, res) {
    mediator.once('done:wfm:user:list', function(data) {
      res.json(data);
    });
    mediator.publish('wfm:user:list');
  });
  router.route('/:id').get(function(req, res) {
    var userId = req.params.id;
    mediator.once('done:wfm:user:read:' + userId, function(data) {
      res.json(data);
    });
    mediator.publish('wfm:user:read', userId);
  });
  router.route('/:id').put(function(req, res) {
    var userId = req.params.id;
    var user = req.body.user;
    mediator.once('done:wfm:user:update:' + userId, function(saveduser) {
      res.json(saveduser);
    });
    mediator.publish('wfm:user:update', user);
  });
  router.route('/').post(function(req, res) {
    var ts = new Date().getTime();  // TODO: replace this with a proper uniqe (eg. a cuid)
    var user = req.body.user;
    user.createdTs = ts;
    mediator.once('done:wfm:user:create:' + ts, function(createduser) {
      res.json(createduser);
    });
    mediator.publish('wfm:user:create', user);
  });
  router.route('/:id').delete(function(req, res) {
    var userId = req.params.id;
    var user = req.body.user;
    mediator.once('done:wfm:user:delete:' + userId, function(deleted) {
      res.json(deleted);
    });
    mediator.publish('wfm:user:delete', user);
  });
  return router;
}

/**
* Function to trim the authentication response to remove certain fields from being sent.
* By default, the password will be removed from the response.
* @param authResponse {object} - the untrimmed auth response
* @param exclusionList {array} - the array of field names to remove from the authentication response
* @return authResponse {object} - the trimmed authentication response
*/
function trimAuthResponse(authResponse, exclusionList) {
  if (exclusionList === undefined || exclusionList === null) {
    // return a default auth response if the exclusion list is null or undefined
    return _.omit(authResponse, config.defaultAuthResponseExclusionList);
  }
  return _.omit(authResponse, exclusionList);
}

function init(mediator, app, authResponseExclusionList) {
  var router = initRouter(mediator, authResponseExclusionList);
  app.use(config.apiPath, router);
}

module.exports = {
  init: init,
  trimAuthResponse: trimAuthResponse
};
