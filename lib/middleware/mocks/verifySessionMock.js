var sinon = require('sinon');

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
    .callsArgWith(4, undefined, "OK");

  //invalid session token
  stub.withArgs(
    sinon.match.object,
    sinon.match.object,
    "invalid_sessionToken",
    sinon.match.object,
    sinon.match.func
  )
    .callsArgWith(4, undefined, 401);

  stub.throws("Invalid Argument");

  return stub;
}

module.exports = function() {
  return verifySession();
};