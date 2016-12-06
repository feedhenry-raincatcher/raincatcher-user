var q = require('q')
  , $fh = require('fh-mbaas-api')
  , _ = require('lodash');

var Delegate = function(guid) {
  this.guid = guid;
};

Delegate.prototype.xhr = function(_options) {
  var defaultOptions = {
    guid: this.guid,
    path: '/api/wfm/user',
    method: 'GET'
  };
  var options = _.defaults(_options, defaultOptions);
  var deferred = q.defer();
  $fh.service(options, function(err, data) {
    if (err) {
      deferred.reject(err);
      return;
    }
    deferred.resolve(data);
  });
  return deferred.promise;
};

Delegate.prototype.list = function() {
  return this.xhr({});
};

Delegate.prototype.read = function(id) {
  return this.xhr({
    path: '/api/wfm/user/' + id
  });
};

Delegate.prototype.update = function(user) {
  return this.xhr({
    path: '/api/wfm/user/' + user.id,
    method: 'PUT',
    params: {
      user: user
    }
  });
};

Delegate.prototype.delete = function(user) {
  return this.xhr({
    path: '/api/wfm/user/' + user.id,
    method: 'DELETE',
    params: {
      user: user
    }
  });
};

Delegate.prototype.create = function(user) {
  return this.xhr({
    path: '/api/wfm/user',
    method: 'POST',
    params: {
      user: user
    }
  });
};

// Delegate the
Delegate.prototype.auth = function(params) {
  var deferred = q.defer();
  $fh.service({
    'guid': this.guid,
    'path': '/api/wfm/user/auth',
    'method': 'POST',
    'params': params
  }, function(err, body, serviceResponse) {
    console.log('statuscode: ', serviceResponse && serviceResponse.statusCode);
    if (err) {
      console.log('service call failed - err : ', err);
      deferred.reject(err);
    } else {
      console.log('Got response from service - status body : ', serviceResponse.statusCode, body);
      deferred.resolve(body);
    }
  });
  return deferred.promise;
};

Delegate.prototype.verifysession = function(sessId) {
  return this.xhr({
    path: '/api/wfm/user/verifysession',
    method: 'POST',
    params: {
      sessId: sessId
    }
  });
};

Delegate.prototype.revokesession = function(sessId) {
  return this.xhr({
    path: '/api/wfm/user/revokesession',
    method: 'POST',
    params: {
      sessId: sessId
    }
  });
};