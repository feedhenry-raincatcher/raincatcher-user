'use strict';

module.exports = function(mediator, app, guid) {
  require('../user/user-session')(mediator, app, guid);
  require('../user/user-router')(app, guid);
  require('../group/group-router')(mediator, app);
  require('../membership/membership-router')(mediator, app);
};
