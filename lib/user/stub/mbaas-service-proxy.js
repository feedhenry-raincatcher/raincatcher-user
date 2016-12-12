var sinon = require('sinon');
require('sinon-as-promised');

function getMockVerifySessionStub() {
  var mockVerifySessionStub = sinon.stub();

  mockVerifySessionStub.withArgs('myvalidsessiontoken').resolves({
    isValid: true
  });

  mockVerifySessionStub.withArgs('myinvalidvalidsessiontoken').resolves({
    isValid: false
  });

  return mockVerifySessionStub;
}

function getMockSessionObject(verifySessionStub) {


  function MockMbaasServiceProxy(guid) {
    this.guid = guid;
  }

  MockMbaasServiceProxy.prototype.verifysession = verifySessionStub;

  return MockMbaasServiceProxy;
}

module.exports.getMockVerifySessionStub = getMockVerifySessionStub;
module.exports.getMockSessionObject = getMockSessionObject;