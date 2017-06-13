var _ = require('lodash');

/**
 * Initialising a subscriber for Updating users.
 *
 * @param {object} userEntityTopics
 * @param {UserClient} userClient - The User Client
 */
module.exports = function updateUserSubscriber(userEntityTopics, userClient) {

  /**
   *
   * Handling the updating of users
   *
   * @param {object} parameters
   * @param {Object} parameters.userToUpdate - The user to be updated
   * @returns {*}
   */
  return function handleUpdateUserTopic(parameters) {
    parameters = parameters || {};
    if (!_.isPlainObject(parameters.userToUpdate)) {
      return Promise.reject(new Error("Invalid Data To Update A User."));
    }

    return userClient.update(parameters.userToUpdate);
  };
};