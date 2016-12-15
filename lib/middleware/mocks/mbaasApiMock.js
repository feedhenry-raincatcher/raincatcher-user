var sinon = require('sinon');

/*
 * This function builds a sinon stub to define mbaasApi.cache() behaviour
 */
function cache() {
  var stub = sinon.stub();
  var mockSession = {
    cuid: "some_cuid",
    sessiontoken: "valid_sessionToken",
    projectid:"some_project_id",
    appid: "some_app_id",
    appkey: "some_app_key"
  };

  //check session for a valid session token
  stub.withArgs(
    sinon.match({
      act: "load",
      key: mockSession.sessiontoken
    }),
    sinon.match.func
  )
    .callsArgWith(1, undefined, mockSession);

  //check session for an invalid session token
  stub.withArgs(
    sinon.match({
      act: "load",
      key: sinon.match(function(key) {
        return key !== mockSession.sessiontoken;
      })
    }),
    sinon.match.func
  )
    .callsArgWith(1, undefined, null);



  //Save given session using the valid session token as key
  stub.withArgs(
    sinon.match({
      act: "save",
      key: "valid_sessionToken",
      expiry: sinon.match.number,
      value: sinon.match.object
    }),
    sinon.match.func
  )
    .callsArgWith(1, undefined, mockSession);

  stub.throws("Invalid Argument");

  return stub;
}

module.exports = function() {
  return {
    cache: cache()
  };
};