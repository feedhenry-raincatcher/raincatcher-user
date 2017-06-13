var config = require('../../../config/config-group');
var shortid = require('shortid');

var GroupCloudDataTopics = require('fh-wfm-mediator/lib/topics');

function GroupOperations(mediator) {
  this.groupCloudDataTopics = new GroupCloudDataTopics(mediator)
    .prefix(config.cloudDataTopicPrefix)
    .entity(config.dataSetId);
}

/**
 *
 * Creating A New Group Entry
 *
 * @param groupToCreate
 * @returns {Promise}
 */
GroupOperations.prototype.create = function createGroup(groupToCreate) {
  groupToCreate.id = shortid.generate(); //Add id field required by the simple-store module
  return this.groupCloudDataTopics.request('create', groupToCreate);
};

/**
 *
 * Updating An Existing Group Entry
 *
 * @param groupToUpdate
 * @returns {Promise}
 */
GroupOperations.prototype.update = function updateGroup(groupToUpdate) {
  return this.groupCloudDataTopics.request('update', groupToUpdate);
};

/**
 *
 * Reading A Single Group Entry
 *
 * @param id
 * @returns {Promise}
 */
GroupOperations.prototype.read = function readGroup(id) {
  return this.groupCloudDataTopics.request('read', id);
};

/**
 *
 * Listing All Groups
 *
 * @returns {Promise}
 */
GroupOperations.prototype.list = function listGroups() {
  return this.groupCloudDataTopics.request('list');
};

/**
 *
 * Removing A Single Group Entry
 *
 * @param groupToRemove
 * @returns {Promise}
 */
GroupOperations.prototype.remove = function listGroups(groupToRemove) {
  return this.groupCloudDataTopics.request('delete', groupToRemove);
};


module.exports = GroupOperations;