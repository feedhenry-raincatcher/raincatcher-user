# FeedHenry RainCatcher user [![Build Status](https://travis-ci.org/feedhenry-raincatcher/raincatcher-user.png)](https://travis-ci.org/feedhenry-raincatcher/raincatcher-user) [![Coverage Status](https://coveralls.io/repos/github/feedhenry-raincatcher/raincatcher-user/badge.svg?branch=master)](https://coveralls.io/github/feedhenry-raincatcher/raincatcher-user?branch=master)

A module for FeedHenry RainCatcher that manages users, groups and memberships. It provides :
- Backend services to handle CRUD operations for user, group and membership.
- Frontend directives and services providing CRUD clients for user, group and membership.

## Upgrading to 0.2.0 from 0.1.x
Version 0.2.0 introduces session storage for authenticated users utilizing either MongoDB or Redis as storage engines.

This involves an extra parameter to the initialization of the router for the authentication service which contains the configuration for the session storage.

### How to upgrade

In the MBaaS service that authenticates users (e.g. [raincatcher-demo-auth](https://github.com/feedhenry-raincatcher/raincatcher-demo-auth)), initialize the MBaaS router with the new parameter for supplying the configuration for the session storage.

See the [Setup router for Cloud App](#setup-router-for-cloud-app) section for more details.

Version 0.2.1 introduced encryption of the users profile data in localstorage (fh.wfm.profileData). The user will likely need to clear the app data/cache in their phones system settings for this feature to work, as previous plaintext profile data may be left on the phone causing an error when trying to decrypt it. To clear the app data on Android:

* Step 1: Head to the Settings menu. This can be done by tapping the cog icon in your notification shade.
* Step 2: Find Apps (or Applications, depending on your device) in the menu, then locate the app that you want to clear the cache or data for.
* Step 3: Tap on Storage and the buttons for clearing the cache and app data will become available.


## Upgrading to 0.1.0 from 0.0.x
Version 0.1.0 introduces secure authentication along with password hashing. Password update for users is available as part of the updated [raincatcher-demo-portal](https://github.com/feedhenry-raincatcher/raincatcher-demo-portal) (available in Workers > Worker details > Edit)

### How to upgrade
Update your mobile application, portal application, cloud application and auth service to utilize version 0.1.x of `fh-wfm-user`.
Update your auth service to reflect changes in [raincatcher-demo-auth](https://github.com/feedhenry-raincatcher/raincatcher-demo-auth/pull/23)

You will also need to hash your users' passwords using the new hashing algorithm, utilizing one of the following options:
- Manually editing the users' passwords through the updated portal app
- If you already have user passwords stored in a custom persistent storage implementation, run a single-pass migration to store them as hashed strings instead. See [this example](./examples/hashing-migration.js).

## Client-side usage

### Config

```
var mediator = require('fh-wfm-mediator');

var config = {
    //Defaults to true
    forceSessionVerificationOnResume: true
};

userCore(mediator, config);

```

#### forceSessionVerificationOnResume

Flag for verifying a session when an app has resumed. This is useful for cases where the app was in the background for an extended period and a check needs to be made to verify that the current session is still valid.

If you have a custom method for verification when the app resumes, set the flag to `false`.

### Subscribed Topics

#### Users


| Topic                                 |  Parameters |
| -------------                         |:-------------:  |
| wfm:sync:users:create            |    ```{userToCreate: {<user fields>}}```         |
| wfm:sync:users:update            |    ```{userToUpdate: {id: "IDOFUSERTOUPDATE", ...}}```        | 
| wfm:sync:users:list              |    ```NONE```         |
| wfm:sync:users:remove            |    ```{userToRemove: {id: "IDOFUSERTOREMOVE"}}```         |
| wfm:sync:users:read              |    ```{id: "IDOFUSERTOREAD"}```         |
| wfm:sync:users:read_profile              |    ```NONE```         |
| wfm:sync:users:clear_session              |    ```NONE```         |
| wfm:sync:users:verify_session              |    ```NONE```         |
| wfm:sync:users:has_session              |    ```NONE```         |
| wfm:sync:users:authenticate              |    ```{username: "user1234", password: "password1234"}```         |



## Usage in an express backend and mbaas service

### Setup router for Cloud App
The server-side component of this RainCatcher module exports a function that takes an [Express](http://expressjs.com/) application and [mediator](https://github.com/feedhenry-raincatcher/raincatcher-mediator) instances as parameters, as follows:

```javascript
var express = require('express')
  , app = express()
  , mbaasExpress = mbaasApi.mbaasExpress()
  , mediator = require('fh-wfm-mediator/lib/mediator')
  ;
// Set authServiceGuid
var authServiceGuid = process.env.WFM_AUTH_GUID;

// configure the express app
...

// setup the wfm user router
require('fh-wfm-user/lib/cloud')(mediator, app, authServiceGuid);

```

#### Securing endpoints with the `validateSession` middleware

Version 0.2.0 of this module adds session storage and management, with the capability of requiring users to be authenticated in order to access certain endpoints of your Cloud App

In order to enforce authentication on specific endpoints for your Cloud App, add the [`validateSesssion` middleware](./lib/middleware/validateSession.js) to the middleware chain before the handlers for the endpoints you wish to secure:

```javascript
var fhMbaasApi = require('fh-mbaas-api');
var validateSession = require('fh-wfm-user/lib/middleware/validateSession');

// in this example, require users to be authenticated for fh-wfm-sync calls
app.use('mbaas/sync', validateSession(mediator, mbaasApi,
  // The last parameter is an array of sub-paths to exclude from session validation
  ['/authpolicy']
));
```


### Retrieving user id for session

Top level applications can now obtain userId for sessionToken.
Instead of sending user id from client, current logged user id can be now obtained from session token.
See example bellow:

```javascript
var mbaasApi = require('fh-mbaas-api');
var userSessionApi = require("fh-wfm-user/lib/cloud/sessionApi")(mbaasApi);
  
return userSessionApi.getUserIdForSessionPromise(filter.sessionToken).then(function(userId){
  console.log("userId", userId);
});
```

### Setup MBaaS authentication service

```javascript
var express = require('express')
  , app = express()
  , mbaasExpress = mbaasApi.mbaasExpress()
  , mediator = require('fh-wfm-mediator/lib/mediator')
  ;
// Set authServiveGuid
var authServiceGuid = process.env.WFM_AUTH_GUID;

// configure the express app
...

// setup the wfm user router
const userRouter = require('fh-wfm-user/lib/router/mbaas');

userRouter.init(
  mediator, // fh-wfm-mediator instance
  expressApp, // express application upon which to mount the router
  ['password'], // userProfileExclusionList - the list of fields from a Users profile to exclude from the HTTP responses

  // Session storage configuration, new in 0.2.0
  {
    store: 'mongo', // The store to utilize for session storage,
                    // current available values are ['mongo', 'redis']
    config: {
      // the following parameters are forwarded to express-session
      secret: 'raincatcher',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: true,
        httpOnly: true,
        path: '/'
      }
      // `url` is used by the 'mongo' store for configuration
      url: 'mongodb://localhost:27017/raincatcher-demo-auth-session-store'
      // 'host' and 'port' are used by the 'redis' store
      host: '127.0.0.1',
      port: '6379'
    }
  },

  function callback(err) {
    // router initialized
  });
```

Note: Setting the `userProfileExclusionList` array as `['password', 'banner']` will prevent these fields from appearing in the authentication response. By default, the `password` field is removed from the response. To allow all fields to be sent, set `userProfileExclusionList` to an empty array.

For a more complete example check [the example initialization on raincatcher-demo-auth](https://github.com/feedhenry-raincatcher/raincatcher-demo-auth/blob/0e9d5edb200fdf84e39ce4dac08c48fadefded8a/application.js#L61).

### Environment variables
The `WFM_AUTH_POLICY_ID` env var can be set in the WFM Cloud App to override the default `wfm` auth policy ID.

### Exposed CRUD endpoints

Base url : `/api/wfm/[group|user|membership|`

| resource | method | returns |
| -------- | ------ | ------- |
| / | GET | array of users/groups/memberships |
| /:id | GET | user/group/membership |
| /:id | PUT | updated user/group/membership |
| / | POST | created user/group/membership |
| /:id | DELETE | deleted user/group/membership |

### Exposed Auth endpoints

Base url : `/api/wfm/user`

| resource | parameters | method | returns | description |
| -------- | ------ | ------- | ---- |
| /auth | all | `{status: 'ok', userId: username, sessionToken: sessiontoken, authResponse: authResponse}` | `sessionToken` : identifier for a specific user for the duration of that user's visit. <br>  `authResponse` : authentication response containing the authenticated users details. |
| /verifysession | all | `{isValid: true}` | |
| /revokesession | all | `{}` |  | |



### message data structure example
- user :

```javascript

  {
    "id" : "156340",
    "username" : "trever",
    "name" : "Trever Smith",
    "position" : "Senior Truck Driver",
    "phone" : "(265) 725 8272",
    "email" : "trever@wfm.com",
    "notes" : "Trever doesn't work during the weekends.",
    "avatar" : "https://s3.amazonaws.com/uifaces/faces/twitter/kolage/128.jpg",
    "banner" : "http://web18.streamhoster.com/pentonmedia/beefmagazine.com/TreverStockyards_38371.jpg"
  }

```
- group :

```javascript
  {
    id: 1010,
    name: 'Drivers',
    role: 'worker'
  }
```
- membership :

```javascript
  {
    id: 0,
    group: 1010,
    user: 156340
  }
```
