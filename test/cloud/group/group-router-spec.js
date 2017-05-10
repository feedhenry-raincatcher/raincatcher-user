var expect = require('chai').expect;
var supertest = require('supertest');
var mediator = require('fh-wfm-mediator/lib/mediator');
var express = require('express');
var bodyParser = require('body-parser');
var mbaasExpress = require('fh-mbaas-api').mbaasExpress();

var CLOUD_DATA_TOPICS = {
  create: "wfm:cloud:data:group:create",
  list: "wfm:cloud:data:group:list",
  update: "wfm:cloud:data:group:update",
  read: "wfm:cloud:data:group:read",
  delete: "wfm:cloud:data:group:delete"
};
var DONE = 'done:';
var ERR = 'error:';

/**
 * A set of tests for the group router
 */
describe('Group Router Test', function() {
  var request;
  var groupRouter;

  //Mock Data
  var req = {};
  var res = {};
  var mockErrMessage;
  var mockGroupList = [
    {id: "group-test-id-1", name: 'Drivers', role: 'worker'},
    {id: "group-test-id-2", name: 'Back Office', role: 'manager'},
    {id: "group-test-id-3", name: 'Management', role: 'admin'}
  ];
  var groupIdSuc = 'group-test-id-1';
  var groupIdNA = 'group-test-id-NA';
  var groupIdErr = 'group-test-id-ERR';

  beforeEach(function(done) {
    var app = express();
    app.use(bodyParser.json());
    request = supertest(app);
    groupRouter = require('./group-router');
    var GroupOperations = require('./groupOperations');

    groupRouter(app, new GroupOperations(mediator));
    app.use(mbaasExpress.errorHandler());
    done();
  });

  //List
  it('should return a list of existing groups', function(done) {
    var expectedGroupList = [
      {id: "group-test-id-1", name: 'Drivers', role: 'worker'},
      {id: "group-test-id-2", name: 'Back Office', role: 'manager'},
      {id: "group-test-id-3", name: 'Management', role: 'admin'}
    ];
    //Mock of the data topic subscriber in the storage module
    mediator.subscribe(CLOUD_DATA_TOPICS.list, function() {
      //Publish to done list data topic to fake getting the list of groups by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.list, mockGroupList);
    });

    request
      .get('/api/wfm/group/')
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected group list to be returned from the request").to.deep.equal(expectedGroupList);
      })
      .end(done);
  });

  //Read
  it('should read an existing group', function(done) {
    var expectedGroupRead = {id: "group-test-id-1", name: 'Drivers', role: 'worker'};

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.read, function(uid) {
      //Publish to done read data topic to fake the reading of group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.read + ':' + uid, mockGroupList[0]);
    });

    request
      .get('/api/wfm/group/' + groupIdSuc)
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected group with the given group id to be returned").to.deep.equal(expectedGroupRead);
      })
      .end(done);
  });

  it('should return an empty object upon reading a non-existing group', function(done) {
    var expectedGroupRead = {};
    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.read, function(uid) {
      //Publish to done read data topic to fake the reading of a non-existing group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.read + ':' + uid, {});
    });

    request
      .get('/api/wfm/group/' + groupIdNA)
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected an empty object to be returned upon reading a group that does not exist").to.deep.equal(expectedGroupRead);
      })
      .end(done);
  });

  it('should return an error if an error occurred when attempting to read a group', function(done) {
    mockErrMessage = "An error occurred during group read";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.read, function(uid) {
      //Publish to error read data topic to fake an error occurrence during the reading of a group by the storage module
      mediator.publish('error:' + CLOUD_DATA_TOPICS.read + ':' + uid, new Error(mockErrMessage));
    });

    request
      .get('/api/wfm/group/' + groupIdErr)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected a response error to be received").to.be.a('error');
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected no results to be received").to.deep.equal({});
      }).end(done);
  });

  // Update
  it('should return the group that was updated', function(done) {
    req = {id: groupIdSuc, name: 'Drivers-UPDATED', role: 'worker'};
    var expectedGroupUpdated = {id: groupIdSuc, name: 'Drivers-UPDATED', role: 'worker'};

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.update, function(groupToUpdate) {
      //Publish to done update data topic to fake the update of a group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.update + ':' + groupToUpdate.id, groupToUpdate);
    });

    request
      .put('/api/wfm/group/' + groupIdSuc)
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected the updated group to be received").to.deep.equal(expectedGroupUpdated);
      })
      .end(done);
  });

  it('should return an error upon the attempt of updating a non-existing group', function(done) {
    req = {id: groupIdNA, name: 'Drivers-UPDATED', role: 'worker'};
    mockErrMessage = "Group to be updated does not exist";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.update, function(groupToUpdate) {
      //Publish to error update data topic to fake the update of a non-existing group by the storage module
      mediator.publish(ERR+ CLOUD_DATA_TOPICS.update + ':' + groupToUpdate.id, new Error(mockErrMessage));
    });

    request
      .put('/api/wfm/group/' + groupIdNA)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected a response error to be received").to.be.a('error');
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected no results to be received").to.deep.equal({});
      })
      .end(done);
  });

  it('should return an error if an error occurred when attempting to update a group', function(done) {
    req = {id: groupIdErr, name: 'Drivers-UPDATED', role: 'worker'};
    mockErrMessage = "An error occurred during group update";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.update, function(groupToUpdate) {
      //Publish to error update data topic to fake an error occurence during the update of a group by the storage module
      mediator.publish(ERR+ CLOUD_DATA_TOPICS.update + ':' + groupToUpdate.id, new Error(mockErrMessage));
    });

    request
      .put('/api/wfm/group/' + groupIdErr)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected a response error to be received").to.be.a('error');
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
      })
      .end(done);
  });

  //Create
  it('should return the group that was created', function(done) {
    req = {id: 'group-test-generated-id', name: 'New Group', role: 'worker'};
    var expectedGroupCreated = {id: 'group-test-generated-id', name: 'New Group', role: 'worker'};

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.create, function(groupToUpdate) {
      //Publish to done create data topic to fake the creation of a group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.create + ':' + groupToUpdate.id, req);
    });

    request
      .post('/api/wfm/group/')
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected the created group to be received").to.deep.equal(expectedGroupCreated);
      })
      .end(done);
  });

  //Delete
  it('should return the group that has been deleted', function(done) {
    req = {id: groupIdSuc, name: 'Drivers', role: 'worker'};
    var expectedGroupDeleted = {id: groupIdSuc, name: 'Drivers', role: 'worker'};

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.delete, function(groupToUpdate) {
      //Publish to done delete data topic to fake the deletion of a group by the storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.delete + ':' + groupToUpdate.id, req);
    });

    request
      .delete('/api/wfm/group/' + groupIdSuc)
      .send(req, res)
      .expect(200)
      .expect(function(res) {
        expect(res.error, "Expected no response error to be received").to.be.false;
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected the deleted group to be received").to.deep.equal(expectedGroupDeleted);
      })
      .end(done);
  });

  it('should return an error upon the attempt of deleting a non-existing group', function(done) {
    req = {id: groupIdNA, name: 'Group-NA', role: 'Role-NA'};
    mockErrMessage = "Group to be deleted does not exist";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.delete, function(groupToUpdate) {
      //Publish to error delete data topic to fake the deletion of a non-existing group by the storage module
      mediator.publish(ERR + CLOUD_DATA_TOPICS.delete + ':' + groupToUpdate.id, new Error(mockErrMessage));
    });

    request
      .delete('/api/wfm/group/' + groupIdNA)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected a response error to be received").to.be.a('error');
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected no results to be received").to.deep.equal({});
      })
      .end(done);
  });

  it('should return an error if an error occurred when attempting to update a group', function(done) {
    req = {id: groupIdErr, name: 'Group-ERR', role: 'Role-ERR'};
    mockErrMessage = "An error occurred during group deletion";

    //Mock of the data topic subscriber in the storage module
    mediator.once(CLOUD_DATA_TOPICS.delete, function(groupToUpdate) {
      //Publish to error delete data topic to fake an error occurrence during the deletion of a group by the storage module
      mediator.publish(ERR + CLOUD_DATA_TOPICS.delete + ':' + groupToUpdate.id, new Error(mockErrMessage));
    });

    request
      .delete('/api/wfm/group/' + groupIdErr)
      .send(req, res)
      .expect(500)
      .expect(function(res) {
        expect(res.error, "Expected a response error to be received").to.be.a('error');
        expect(res, "Expected a response to be received").to.exist;
        expect(res, "Expected response to be an object").to.be.a('object');
        expect(res.body, "Expected no results to be received").to.deep.equal({});
      })
      .end(done);
  });
});