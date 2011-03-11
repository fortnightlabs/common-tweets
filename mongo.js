var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , mongodb = require('mongodb')
  , Db = mongodb.Db
  , Connection = mongodb.Connection
  , Server = mongodb.Server
  , BSON = mongodb.BSONNative;

function Mongo(options) {
  var self = this
    , env = options.env || process.env.NODE_ENV || 'development'
    , name = options.name
    , host = options.host || process.env.MONGO_HOST || 'localhost'
    , port = options.port || process.env.MONGO_PORT || Connection.DEFAULT_PORT
    , user = options.user || process.env.MONGO_USER
    , pass = options.password || process.env.MONGO_PASSWORD
    , collections = options.collections
    , server = new Server(host, port, {})
    , db = new Db(name + '_' + env, server, { native_parser: true })
    , objs = {
      server: server,
      connection: db,
      lib: mongodb,
      BSON: BSON }
    , ready = false;

  EventEmitter.call(self);

  // open the database connection, authenticating if necessary
  db.open(function(err, db) {
    if (err) return self.emit('error', err);

    if (user) {
      db.authenticate(user, pass, loadCollections);
    } else {
      loadCollections();
    }
  });

  // still fire ready if a new "ready" listener comes in after load
  self.on('newListener', function(evt, listener) {
    if ((evt === 'ready') && ready) listener(objs);
  });

  function loadCollections() {
    var threads = collections.length;

    // load collections
    collections.forEach(function(name) {
      db.collection(name, function(err, collection) {
        if (err) return self.emit('error', err);

        objs[name] = collection;
        console.log('loaded collection ' + name);

        if (--threads === 0) {
          ready = true;
          self.emit('ready', objs);
        }
      });
    });
  }
};
util.inherits(Mongo, EventEmitter);

module.exports = function(options) { return new Mongo(options); };
