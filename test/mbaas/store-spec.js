var assert = require('assert');
var mediator = require('fh-wfm-mediator/lib/mediator');
var Store = require('./store')({
  persistent: process.env.WFM_USE_MEMORY_STORE !== 'true'
});
var store;
var hrtime = process.hrtime;

var fixtures = require('../../test/fixtures/mockUsers.json');
var daisyId = 'rJeXyfdrH';
var userToCreate = {
  "username" : "jdoe",
  "name" : "John Doe",
  "position" : "Truck Inspector",
  "phone" : "(265) 754 8176",
  "email" : "jdoe@wfm.com",
  "avatar" : "https://s3.amazonaws.com/uifaces/faces/twitter/madysondesigns/128.jpg",
  "password" : "Password1"
};

/**
 * Outputs difference between two process.hrtime() in ms
 */
function hrtimeDiff(start, end) {
  var delta = [end[0] - start[0], end[1] - start[1]];
  // seconds in ms
  var s = delta[0] * 1e3;
  // nanoseconds in ms
  var ns = delta[1] * 1e-6;

  return s + ns;
}

describe('store', function() {
  beforeEach(function() {
    store = new Store('user');
    return store.init(fixtures);
  });
  afterEach(function() {
    return store.deleteAll();
  });
  describe('#list', function() {
    it('should return all users', function() {
      return store.list().then(function(res) {
        assert.equal(res.length, fixtures.length);
      });
    });
  });
  describe('#read', function() {
    it('should find an user by id', function() {
      return store.read(daisyId).then(function(daisy) {
        assert(daisy.username === 'daisy');
      });
    });
    it('should not allow edits', function() {
      return store.read(daisyId).then(function(daisy) {
        daisy.username = 'donald duck';
      }).then(function() {
        return store.read(daisyId);
      }).then(function(daisy2) {
        assert.equal(daisy2.username, 'daisy',
          'username should not have been edited');
      });
    });
    it('should error when not found', function(done) {
      store.read('invalid_id').then(function(user) {
        assert(!user);
      }).then(function() {
        done('should have had an error');
      }).catch(function(err) {
        assert(err);
        done();
      });
    });
  });
  describe('#byUsername', function() {
    it('should find an user by username', function() {
      return store.byUsername('daisy').then(function(daisy) {
        assert(daisy.username === 'daisy');
      });
    });
    it('should not allow edits', function() {
      return store.byUsername('daisy').then(function(daisy) {
        daisy.username = 'donald duck';
      }).then(function() {
        return store.byUsername('daisy');
      }).then(function(daisy2) {
        assert(daisy2);
      });
    });
    it('should error when not found', function(done) {
      store.byUsername('invalid_username').then(function(user) {
        assert(!user);
      }).then(function() {
        done('should have had an error');
      }).catch(function(err) {
        assert(err);
        done();
      });
    });
  });
  describe('#create', function() {
    it('should add a new user [slow]', function() {
      var oldCount;
      return store.list().then(function(orig) {
        oldCount = orig.length;
        return store.create(userToCreate);
      }).then(function() {
        return store.list();
      }).then(function(newUsers) {
        assert.equal(newUsers.length, oldCount + 1,
          'total users should have increased by 1');
      });
    });
    it('should generate an id [slow]', function() {
      return store.create(userToCreate).then(function(user) {
        assert(user.id);
      });
    });
  });
  describe('#update', function() {
    it('should update fields', function() {
      return store.update({id: daisyId, position: 'test'}).then(function(newDaisy) {
        assert.equal(newDaisy.username, 'daisy');
        assert.equal(newDaisy.position, 'test');
      });
    });
    it('should error when not found', function(done) {
      store.update({id: 'invalid_id', position:'test'}).then(function(user) {
        assert(!user);
      }).then(function() {
        return done('should have had an error');
      }).catch(function(err) {
        assert(err);
        done();
      });
    });
  });
  describe('#verifyPassword', function() {
    beforeEach(function() {
      return store.create(userToCreate);
    });
    it('should error when not found', function(done) {
      store.verifyPassword('invalidusername', userToCreate.password).then(function(match) {
        assert(!match);
      }).then(done).catch(function(err) {
        assert(err);
        done();
      });
    });
    it('should return true on correct password [slow]', function() {
      return store.verifyPassword(userToCreate.username, userToCreate.password).then(assert);
    });
    it('should have a delay on login attempts [slow]', function() {
      var end;
      var start = hrtime();
      return store.verifyPassword(userToCreate.username, 'nope').catch(function() {
        return store.verifyPassword(userToCreate.username, 'nope');
      }).catch(function() {
        end = hrtime();
        return assert(hrtimeDiff(start, end) > 500,
          'should have waited at least 500ms');
      });
    });
  });
  describe('#updatePassword', function() {
    beforeEach(function() {
      return store.create(userToCreate);
    });
    it('should error when user not found', function() {
      return store.updatePassword('invalid_username', 'old', 'new').then(function() {
        throw new Error('should have had an error');
      }).catch(assert);
    });
    it('should error when old password is not correct [slow]', function() {
      return store.updatePassword(userToCreate.username, 'nope', 'new')
      .then(function() {
        throw new Error('should have had an error');
      }).catch(assert);
    });
    it('should update the password when the old one is provided [slow]', function() {
      return store.updatePassword(userToCreate.username, userToCreate.password, 'new')
      .then(function() {
        return store.verifyPassword(userToCreate.username, 'new');
      }).then(function(match) {
        assert(match);
      });
    });
  });
  describe('#delete', function() {
    it('should remove a user', function() {
      return store.delete(daisyId).then(function(user) {
        assert.equal(user.username, 'daisy');
      });
    });
    it('should return null when user not found', function() {
      return store.delete('invalid_username').then(function(user) {
        assert.equal(user, null);
      });
    });
  });
  describe('#listen', function() {
    beforeEach(function() {
      return store.listen('', mediator);
    });
    it('should subscribe to wfm:user:username:read', function() {
      return mediator.request('wfm:user:username:read', 'daisy', {uid: 'daisy'})
      .then(function(user) {
        assert(user.id, daisyId);
      });
    });
    it('should subscribe to wfm:user:auth [slow]', function() {
      return mediator.request('wfm:user:auth', {username: 'daisy', password: '123'}, {uid: 'daisy'})
      .then(function(match) {
        assert(match);
      });
    });
    it('should subscribe to wfm:user:password [slow]', function() {
      return mediator.request('wfm:user:password', {username: 'daisy', oldPwd: '123', newPwd: 'new'}, {uid: 'daisy'})
      .then(function(user) {
        assert(user.id, daisyId);
        return mediator.request('wfm:user:auth', {username: 'daisy', password: 'new'}, {uid: 'daisy'});
      })
      .then(function(match) {
        assert(match);
      });
    });
    afterEach(function() {
      return store.unsubscribe();
    });
  });
});
