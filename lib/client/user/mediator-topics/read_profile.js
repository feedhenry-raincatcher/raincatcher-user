/**
 * Initialsing a subscriber for Reading users.
 *
 * @param {object} userEntityTopics
 * @param {UserClient} userClient - The User Client
 */
module.exports = function readCurrentLoggedInUser(userEntityTopics, userClient) {

  /**
   *
   * Handling the reading of the current logged in user.
   *
   * @param {object} parameters
   * @returns {*}
   */
  return function handleReadCurrentLoggedInUser() {
    return userClient.getProfile();
  };
};