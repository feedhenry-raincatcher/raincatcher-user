var sinon = require('sinon');
require('sinon-as-promised');
var sampleUserData = require('../fixtures/user');

/**
 * This function builds sinon stub to define mediator.request() behaviour.
 *
 * Example usage:
 * mediator.request('wfm:example:topic', parameter), (returns Promise)
 * stub.withArgs('wfm:example:topic', {parameter(sinon.match)}).resolves( {return value} )
 * stub.withArgs('wfm:example:topic', {parameter(sinon.match)}).rejects( {error})
 *
 * @returns {stub} mediator stub
 */
function getRequestStub() {
  var stub = sinon.stub();

  // valid user list read stub
  stub.withArgs('wfm:user:list').resolves(true);

  // valid user read stub
  stub.withArgs('wfm:user:read', sinon.match(function(uid) {
    return sampleUserData.validUserIds.indexOf(uid) > -1;
  })).resolves(sampleUserData.sampleUser);

  // invalid user read stub
  stub.withArgs('wfm:user:read', sinon.match(function(uid) {
    return sampleUserData.validUserIds.indexOf(uid) === -1;
  })).rejects();

  // valid user update stub
  stub.withArgs('wfm:user:update', sinon.match.any,
    sinon.match({uid: sinon.match(function(uid) {
      return sampleUserData.validUserIds.indexOf(uid) > -1;
    })})).resolves(sampleUserData.sampleUserUpdate);

  // invalid user update stub
  stub.withArgs('wfm:user:update', sinon.match.any,
    sinon.match({uid: sinon.match(function(uid) {
      return sampleUserData.validUserIds.indexOf(uid) === -1;
    })})).rejects();

  // valid user create stub
  stub.withArgs('wfm:user:create', sinon.match(sampleUserData.sampleUser)).resolves(sampleUserData.sampleUser);

  // invalid user create stub
  stub.withArgs('wfm:user:create', sinon.match(sampleUserData.invalidUserProfile)).rejects();

  // valid user delete stub
  stub.withArgs('wfm:user:delete', sampleUserData.validUserIds[0]).resolves(sampleUserData.sampleUser);

  // invalid user delete stub
  stub.withArgs('wfm:user:delete', sampleUserData.invalidUserIds[0]).rejects();

  // valid credentials auth stub
  stub.withArgs('wfm:user:auth', {username: sampleUserData.sampleUser.username, password: sampleUserData.sampleUser.password}).resolves(true);

  // invalid username auth stub
  stub.withArgs('wfm:user:auth',
    sinon.match({
      username: sinon.match(function(username) {
        return username !== sampleUserData.sampleUser.username;
      }),
      password: sinon.match(sampleUserData.sampleUser.password)
    })).rejects(new Error());

  // invalid password auth stub
  stub.withArgs('wfm:user:auth',
    sinon.match({
      username: sinon.match(sampleUserData.sampleUser.username),
      password: sinon.match(function(password) {
        return password !== sampleUserData.sampleUser.password;
      })
    })).rejects(new Error());

  //valid username read stub
  stub.withArgs('wfm:user:username:read', sampleUserData.sampleUser.username)
    .resolves(sampleUserData);

  // invalid username read stub
  stub.withArgs('wfm:user:username:read',
    sinon.match(function(username) {
      return username !== sampleUserData.sampleUser.username;
    })).rejects(new Error());

  return stub;
}

function publishStub() {
  var stub = sinon.stub();

  stub.withArgs(sinon.match.string, sinon.match.object).returns(true);

  return stub;
}

module.exports = {
  request: getRequestStub(),
  publish: publishStub()
};