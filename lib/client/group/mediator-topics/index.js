var _ = require('lodash');
var topicHandlers = {
  list: require('./list'),
  read: require('./read'),
  create: require('./create'),
  update: require('./update'),
  remove: require('./remove')
};
var CONSTANTS = require('../../../constants');

var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');

var groupSubscribers;

module.exports = {
  /**
   * Initialisation of all the topics that this module is interested in.
   *
   * @param mediator
   * @param {GroupClient} groupClient
   *
   * @returns {Topics|exports|module.exports|*}
   */
  init: function(mediator, groupClient) {
    //If there is already a set of subscribers set up, then don't subscribe again.
    if (groupSubscribers) {
      return groupSubscribers;
    }

    groupSubscribers = new MediatorTopicUtility(mediator);
    groupSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.GROUP_ENTITY_NAME);

    //Setting up subscribers to the group topics.
    _.each(CONSTANTS.TOPICS, function(topicName) {
      if (topicHandlers[topicName]) {
        groupSubscribers.on(topicName, topicHandlers[topicName](groupSubscribers, groupClient));
      }
    });

    return groupSubscribers;
  },
  tearDown: function() {
    if (groupSubscribers) {
      groupSubscribers.unsubscribeAll();
      groupSubscribers = null;
    }
  }
};