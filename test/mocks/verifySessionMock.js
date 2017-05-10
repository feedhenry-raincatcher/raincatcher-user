var sinon = require('sinon');
var mockSession = {
  cuid: "some_cuid",
  sessiontoken: "valid_sessionToken",
  projectid: "some_project_id",
  appid: "some_app_id",
  appkey: "some_app_key"
};

/*
 * This function builds a sinon stub to define the verifySession() behaviour
 */
function verifySession() {
  var stub = sinon.stub();

  //valid session token
  stub.withArgs(
    sinon.match.object,
    sinon.match.object,
    "some_valid_sessionToken",
    sinon.match.object,
    sinon.match.func
  )
    .callsArgWith(4, undefined, mockSession);

  //invalid session token
  stub.withArgs(
    sinon.match.object,
    sinon.match.object,
    "invalid_sessionToken",
    sinon.match.object,
    sinon.match.func
  )
    .callsArgWith(4, undefined, null);

  stub.throws("Invalid Argument");

  return stub;
}

module.exports = function() {
  return verifySession();
};