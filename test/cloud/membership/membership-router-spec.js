var expect = require('chai').expect;
var supertest = require('supertest');
var mediator = require('fh-wfm-mediator/lib/mediator');
var express = require('express');
var bodyParser = require('body-parser');
var mbaasExpress = require('fh-mbaas-api').mbaasExpress();


var CLOUD_DATA_TOPICS = {
  create: "wfm:cloud:data:membership:create",
  list: "wfm:cloud:data:membership:list",
  update: "wfm:cloud:data:membership:update",
  read: "wfm:cloud:data:membership:read",
  delete: "wfm:cloud:data:membership:delete"
};
var DONE = 'done:';
var ERR = 'error:';

/**
 * A set of tests for the membership router
 */
describe('Membership Router Test', function() {
  var app;
  var request;
  var membershipRouter;

  //Mock Data
  var req = {};
  var res = {};
  var mockErrMessage;

  var mockMembershipList = [
    {id: "membership-test-id-1", group: 'test-group-1', user: 'test-user-1'},
    {id: "membership-test-id-2", group: 'test-group-2', user: 'test-user-2'},
    {id: "membership-test-id-3", group: 'test-group-3', user: 'test-user-3'}
  ];
  var membershipIdSuc = 'membership-test-id-1';
  var membershipIdNA = 'membership-test-id-NA';
  var membershipIdErr = 'membership-test-id-ERR';

  beforeEach(function(done) {
    app = express();
    app.use(bodyParser.json());
    request = supertest(app);
    membershipRouter = require('./membership-router');
    var MembershipOperations = require('./membershipOperations');

    membershipRouter(app, new MembershipOperations(mediator));
    app.use(mbaasExpress.errorHandler());
    done();
  });

  //List
  it('should return a list of existing memberships', function(done) {
    //Mock of the data topic subscriber in the storage module
    mediator.subscribe(CLOUD_DATA_TOPICS.list, function() {
      //Publish to done list data topic to fake getting the list of groups by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.list, mockMembershipList);
    });

    var expectedMembershipList = [
      {id: "membership-test-id-1", group: 'test-group-1', user: 'test-user-1'},
      {id: "membership-test-id-2", group: 'test-group-2', user: 'test-user-2'},
      {id: "membership-test-id-3", group: 'test-group-3', user: 'test-user-3'}
    ];

    request
      .get('/api/wfm/membership/')
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected membership list to be returned from the list request").to.deep.equal(expectedMembershipList);
      })
      .end(done);
  });

  //Read
  it('should read an existing membership', function(done) {
    var expectedMembershipList = [
      {id: "membership-test-id-1", group: 'test-group-1', user: 'test-user-1'},
      {id: "membership-test-id-2", group: 'test-group-2', user: 'test-user-2'},
      {id: "membership-test-id-3", group: 'test-group-3', user: 'test-user-3'}
    ];
    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.read, function(uid) {
      //Publish to done read data topic to fake the reading of group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.read + ':' + uid, mockMembershipList[0]);
    });

    request
      .get('/api/wfm/membership/' + membershipIdSuc)
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected membership list to be returned from the list request").to.deep.equal(expectedMembershipList[0]);
      })
      .end(done);
  });

  it('should return an empty object upon reading a non-existing membership', function(done) {
    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.read, function(uid) {
      //Publish to done read data topic to fake the reading of a non-existing group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.read + ':' + uid, {});
    });

    request
      .get('/api/wfm/membership/' + membershipIdNA)
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected membership list to be returned from the list request").to.deep.equal({});
      })
      .end(done);
  });

  it('should return an error if an error occurred when attempting to read a membership', function(done) {
    mockErrMessage = "An error occurred during membership read";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.read, function(uid) {
      //Publish to error read data topic to fake an error occurrence during the reading of a group by the storage module
      mediator.publish(ERR + CLOUD_DATA_TOPICS.read + ':' + uid, new Error(mockErrMessage));
    });

    request
      .get('/api/wfm/membership/' + membershipIdErr)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.a('error');
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected no results to be received").to.deep.equal({});
      })
      .end(done);
  });

  //Update
  it('should return the membership that was updated', function(done) {
    var expectedUpdatedMebership = {id: membershipIdSuc, group: 'test-group-1-UPDATED', user: 'test-user-updated'};
    req = {id: membershipIdSuc, group: 'test-group-1-UPDATED', user: 'test-user-updated'};
    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.update, function(membershipToUpdate) {
      //Publish to done update data topic to fake the update of a group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.update + ':' + membershipToUpdate.id, membershipToUpdate);
    });

    request
      .put('/api/wfm/membership/' + membershipIdSuc)
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected the updated membership to be received").to.deep.equal(expectedUpdatedMebership);
      })
      .end(done);
  });

  it('should return an error upon the attempt of updating a non-existing membership', function(done) {
    req = {id: membershipIdNA, group: 'test-group-NA', user: 'test-userNA'};
    mockErrMessage = "An error occurred during membership update";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.update, function(membershipToUpdate) {
      //Publish to error update data topic to fake the update of a non-existing group by the storage module
      mediator.publish(ERR+ CLOUD_DATA_TOPICS.update + ':' + membershipToUpdate.id, new Error(mockErrMessage));
    });

    request
      .put('/api/wfm/membership/' + membershipIdNA)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.a('error');
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected no results to be received").to.deep.equal({});
      })
      .end(done);
  });

  it('should return an error if an error occurred when attempting to update a membership', function(done) {
    req = {id: membershipIdErr, group: 'test-group-ERR', user: 'test-user-ERR'};
    mockErrMessage = "An error occurred during membership update";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.update, function(membershipToUpdate) {
      //Publish to error update data topic to fake an error occurence during the update of a group by the storage module
      mediator.publish(ERR+ CLOUD_DATA_TOPICS.update + ':' + membershipToUpdate.id, new Error(mockErrMessage));
    });

    request
      .put('/api/wfm/membership/' + membershipIdErr)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.a('error');
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected no results to be received").to.deep.equal({});
      })
      .end(done);
  });

  //Create
  it('should return the membership that was created', function(done) {
    var expectedMembershipCreated = {id: 'membership-test-generated-id', group: 'test-group-1', user: 'new-test-user'};
    req = {id: 'membership-test-generated-id', group: 'test-group-1', user: 'new-test-user'};

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.create, function(membershipToUpdate) {
      //Publish to done create data topic to fake the creation of a group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.create + ':' + membershipToUpdate.id, req);
    });

    request
      .post('/api/wfm/membership/')
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected the created membership to be received").to.deep.equal(expectedMembershipCreated);
      })
      .end(done);
  });

  //Delete
  it('should return the membership that has been deleted', function(done) {
    req = {id: membershipIdSuc, group: 'test-group-1', user: 'test-user-1'};
    var expectedMembershipDeleted = {id: membershipIdSuc, group: 'test-group-1', user: 'test-user-1'};

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.delete, function(membershipToUpdate) {
      //Publish to done delete data topic to fake the deletion of a group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.delete + ':' + membershipToUpdate.id, req);
    });


    request
      .delete('/api/wfm/membership/' + membershipIdSuc)
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected the deleted membership to be received").to.deep.equal(expectedMembershipDeleted);
      })
      .end(done);
  });

  it('should return an error upon the attempt of deleting a non-existing membership', function(done) {
    req = {id: membershipIdNA, group: 'test-group-NA', user: 'test-userNA'};
    mockErrMessage = "An error occurred during membership delete";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.delete, function(membershipToUpdate) {
      //Publish to error delete data topic to fake the deletion of a non-existing group by the storage module
      mediator.publish(ERR + CLOUD_DATA_TOPICS.delete + ':' + membershipToUpdate.id, new Error(mockErrMessage));
    });

    request
      .delete('/api/wfm/membership/' + membershipIdNA)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.a('error');
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected no results to be received").to.deep.equal({});
      })
      .end(done);
  });

  it('should return an error if an error occurred when attempting to update a membership', function(done) {
    req = {id: membershipIdErr, group: 'test-group-ERR', user: 'test-user-ERR'};
    mockErrMessage = "An error occurred during membership delete";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.delete, function(membershipToUpdate) {
      //Publish to error delete data topic to fake an error occurrence during the deletion of a group by the storage module
      mediator.publish(ERR + CLOUD_DATA_TOPICS.delete + ':' + membershipToUpdate.id, new Error(mockErrMessage));
    });

    request
      .delete('/api/wfm/membership/' + membershipIdErr)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.a('error');
        expect(res, "Expected a result to be received from the list request").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected no results to be received").to.deep.equal({});
      })
      .end(done);
  });
});