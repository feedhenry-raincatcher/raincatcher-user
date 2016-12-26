var q = require('q')
  , $fh = require('fh-mbaas-api')
  , _ = require('lodash');

/**
 * Proxy for calling MBaaS Service API
 * establishing an independent connection channel between
 * Cloud App and MBaaS Service.
 * @param guid name of MBaas Service
 * @constructor
 */
function MbaasServiceProxy(guid) {
  this.guid = guid;
}

/**
 * MBaaS service API call
 * @param _options we want to overwrite
 * use default options otherwise
 *  - guid, name of mbaas service
 *  - path, URL of MBaaS Service API
 *  - method, HTTP method {GET, PUT}
 * @returns {*|promise}
 */
MbaasServiceProxy.prototype.xhr = function(_options) {
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

MbaasServiceProxy.prototype.list = function() {
  return this.xhr({});
};

MbaasServiceProxy.prototype.read = function(id) {
  return this.xhr({
    path: '/api/wfm/user/' + id
  });
};

MbaasServiceProxy.prototype.update = function(user) {
  return this.xhr({
    path: '/api/wfm/user/' + user.id,
    method: 'PUT',
    params: {
      user: user
    }
  });
};

MbaasServiceProxy.prototype.delete = function(user) {
  return this.xhr({
    path: '/api/wfm/user/' + user.id,
    method: 'DELETE',
    params: {
      user: user
    }
  });
};

MbaasServiceProxy.prototype.create = function(user) {
  return this.xhr({
    path: '/api/wfm/user',
    method: 'POST',
    params: {
      user: user
    }
  });
};

/**
 * MBaaS service auth API call
 * @param params to be used for
 * @returns {*|promise}
 */
MbaasServiceProxy.prototype.auth = function(params) {
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

/**
 * MBaaS service API call for session verification
 * @param sessionToken to be verified
 * @returns {*|promise}
 */
MbaasServiceProxy.prototype.verifysession = function(sessionToken) {
  return this.xhr({
    path: '/api/wfm/user/verifysession',
    method: 'POST',
    params: {
      sessionToken: sessionToken
    }
  });
};

/**
 * MBaaS service API call for session verification
 * @param sessionToken to be revoked
 * @returns {*|promise}
 */
MbaasServiceProxy.prototype.revokesession = function(sessionToken) {
  return this.xhr({
    path: '/api/wfm/user/revokesession',
    method: 'POST',
    params: {
      sessionToken: sessionToken
    }
  });
};

module.exports = MbaasServiceProxy;