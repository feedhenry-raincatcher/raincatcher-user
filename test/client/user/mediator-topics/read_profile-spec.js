var CONSTANTS = require('../../../constants');
var sinon = require('sinon');
require('sinon-as-promised');
var chai = require('chai');
var _ = require('lodash');
var expect = chai.expect;

var mediator = require("fh-wfm-mediator/lib/mediator");
var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');
var mockUser = require('../../../../test/fixtures/sampleUserProfile.json');



describe("Reading Currently Logged In User", function() {

  var usersReadProfileTopic = "wfm:users:read_profile";

  var userSubscribers = new MediatorTopicUtility(mediator);
  userSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.USER_ENTITY_NAME);

  function getMockReadUsers(returnError) {
    var userStub = sinon.stub();

    return {
      getProfile: returnError ? userStub.rejects(new Error("Error reading user profile")) : userStub.resolves(mockUser)
    };
  }


  function createReadSubscriber(mockUserClient) {
    userSubscribers.on(CONSTANTS.TOPICS.READ_PROFILE, require('./read_profile')(userSubscribers, mockUserClient));
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

  it("should read a user profile", function() {

    var mockUserClient = getMockReadUsers(false);

    createReadSubscriber(mockUserClient);

    var doneReadUsersTopic = "done:wfm:users:read_profile";

    var readUsersPromise = mediator.promise(doneReadUsersTopic);

    mediator.publish(usersReadProfileTopic, {
      id: mockUser.id
    });

    return readUsersPromise.then(function(user) {
      expect(user).to.deep.equal(mockUser);
      sinon.assert.calledOnce(mockUserClient.getProfile);
    });
  });

  it("should read a user and respond to a unique topic id", function() {

    var mockUserClient = getMockReadUsers(false);

    createReadSubscriber(mockUserClient);

    var doneReadUsersTopic = "done:wfm:users:read_profile:" +mockUser.id;

    var readUsersPromise = mediator.promise(doneReadUsersTopic);

    mediator.publish(usersReadProfileTopic, {
      id: mockUser.id,
      topicUid: mockUser.id
    });

    return readUsersPromise.then(function(user) {
      expect(user).to.deep.equal(mockUser);
      sinon.assert.calledOnce(mockUserClient.getProfile);
    });
  });

  it("should publish an error if there is an error reading users", function() {
    var mockUserClient = getMockReadUsers(true);

    createReadSubscriber(mockUserClient);

    var errorReadUserTopic = "error:wfm:users:read_profile";

    var readUsersErrorPromise = mediator.promise(errorReadUserTopic);

    mediator.publish(usersReadProfileTopic);

    return readUsersErrorPromise.then(function(error) {
      expect(error.message).to.contain("profile");
      sinon.assert.calledOnce(mockUserClient.getProfile);
    });
  });

});

