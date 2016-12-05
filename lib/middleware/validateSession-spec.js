var sinon = require('sinon');
var proxyquire = require('proxyquire');
var mockMbaasApi = require('./mocks/mbaasApiMock.js');
var mockVerifySession = require('./mocks/verifySessionMock');

describe('Session Validation Middleware', function() {
  var mockNext = sinon.spy();
  var mockRes = {};
  var statusStub = sinon.stub().returns(mockRes);
  var jsonStub = sinon.stub().returns(mockRes);

  mockRes.status = statusStub;
  mockRes.json = jsonStub;

  var mediator,
    mbaasApi,
    validateSession;

  beforeEach(function(done) {
    validateSession = proxyquire('./validateSession.js', {
      './verifySession': mockVerifySession()
    });
    mediator = {};
    mbaasApi = mockMbaasApi();

    done();
  });

  afterEach(function(done) {
    statusStub.reset();
    jsonStub.reset();
    mockNext.reset();

    done();
  });


  it('should return 401 if no session token is available', function(done) {
    var mockReq = {
      fh_params: {
        __fh: {
          cuid: "some_cuid",
          projectid:"some_project_id",
          appid: "some_app_id",
          appkey: "some_app_key"
        }
      }
    };

    validateSession(mediator, mbaasApi)(mockReq, mockRes, mockNext);
    sinon.assert.calledWith(statusStub, sinon.match(401));
    sinon.assert.calledWith(jsonStub, sinon.match(new Error("Unauthorized")));
    sinon.assert.notCalled(mockNext);

    done();
  });

  it('should proceed if session token is valid', function(done) {
    var mockReq = {
      fh_params: {
        __fh: {
          cuid: "some_cuid",
          sessiontoken: "valid_sessionToken",
          projectid: "some_project_id",
          appid: "some_app_id",
          appkey: "some_app_key"
        }
      }
    };

    validateSession(mediator, mbaasApi)(mockReq, mockRes, mockNext);
    sinon.assert.notCalled(statusStub);
    sinon.assert.notCalled(jsonStub);
    sinon.assert.calledOnce(mockNext);

    done();
  });

  it('should save a valid session if it is not in cache', function(done) {
    var mockReq = {
      fh_params: {
        __fh: {
          cuid: "some_cuid",
          sessiontoken: "some_valid_sessionToken",
          projectid: "some_project_id",
          appid: "some_app_id",
          appkey: "some_app_key"
        }
      }
    };

    validateSession(mediator, mbaasApi)(mockReq, mockRes, mockNext);
    sinon.assert.notCalled(statusStub);
    sinon.assert.notCalled(jsonStub);
    sinon.assert.calledOnce(mockNext);

    done();
  });

  it('should return a 401 if session is not valid', function(done) {
    var mockReq = {
      fh_params: {
        __fh: {
          cuid: "some_cuid",
          sessiontoken: "invalid_sessionToken",
          projectid: "some_project_id",
          appid: "some_app_id",
          appkey: "some_app_key"
        }
      }
    };

    validateSession(mediator, mbaasApi)(mockReq, mockRes, mockNext);
    sinon.assert.calledOnce(statusStub);
    sinon.assert.calledWith(jsonStub, sinon.match(new Error("Unauthorized")));
    sinon.assert.notCalled(mockNext);

    done();
  });
});
