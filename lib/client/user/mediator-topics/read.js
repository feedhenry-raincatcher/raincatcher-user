
/**
 * Initialsing a subscriber for Reading users.
 *
 * @param {object} userEntityTopics
 * @param {UserClient} userClient - The User Client
 */
module.exports = function listUsersSubscriber(userEntityTopics, userClient) {

  /**
   *
   * Handling the listing of users
   *
   * @param {object} parameters
   * @param {String} parameters.id               - The ID of the user to read
   * @returns {*}
   */
  return function handleReadUsersTopic(parameters) {
    parameters = parameters || {};
    return userClient.read(parameters.id);
  };
};