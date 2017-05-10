var CONSTANTS = require('../../../constants');
var sinon = require('sinon');
require('sinon-as-promised');
var chai = require('chai');
var _ = require('lodash');
var expect = chai.expect;

var mediator = require("fh-wfm-mediator/lib/mediator");
var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');
var mockUser = require('../../../../test/fixtures/sampleUserProfile.json');



describe("Listing Users", function() {

  var usersListTopic = "wfm:users:list";

  var userSubscribers = new MediatorTopicUtility(mediator);
  userSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.USER_ENTITY_NAME);

  function getMockListUsers(returnError) {
    var userStub = sinon.stub();

    return {
      list: returnError ? userStub.rejects(new Error("Error listing users")) : userStub.resolves([mockUser])
    };
  }


  function createListSubscriber(mockUserClient) {
    userSubscribers.on(CONSTANTS.TOPICS.LIST, require('./list')(userSubscribers, mockUserClient));
  }


  beforeEach(function() {
    this.subscribers = {};
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    userSubscribers.unsubscribeAll();
  });

  it("should list a set of users", function() {

    var mockUserClient = getMockListUsers(false);

    createListSubscriber(mockUserClient);

    var doneListUsersTopic = "done:wfm:users:list";

    var listUsersPromise = mediator.promise(doneListUsersTopic);

    mediator.publish(usersListTopic);

    return listUsersPromise.then(function(arrayOfUsers) {
      expect(arrayOfUsers[0]).to.deep.equal(mockUser);
      sinon.assert.calledOnce(mockUserClient.list);
    });
  });

  it("should publish an error if there is an error reading users", function() {
    var mockUserClient = getMockListUsers(true);

    createListSubscriber(mockUserClient);

    var errorListUsersTopic = "error:wfm:users:list";

    var listUsersErrorPromise = mediator.promise(errorListUsersTopic);

    mediator.publish(usersListTopic);

    return listUsersErrorPromise.then(function(error) {
      expect(error.message).to.contain("listing");
      sinon.assert.calledOnce(mockUserClient.list);
    });
  });

});

