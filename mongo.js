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
    , host = options.host || 'localhost'
    , port = options.port || Connection.DEFAULT_PORT
    , collections = options.collections
    , server = new Server(host, port, {})
    , db = new Db(name + '_' + env, server, { native_parser: true })
    , objs = {
      server: server,
      connection: db,
      lib: mongodb,
      BSON: BSON }
    , ready = false;

  EventEmitter.call(this);

  db.open(function(err, db) {
    if (err) self.emit('error', err);
    var threads = collections.length;

    // load collections
    collections.forEach(function(name) {
      db.collection(name, function(err, collection) {
        if (err) self.emit('error', err);

        objs[name] = collection;
        console.log('loaded collection ' + name);

        if (--threads === 0) {
          ready = true;
          self.emit('ready', objs);
        }
      });
    });
  });

  self.on('newListener', function(evt, listener) {
    if ((evt === 'ready') && ready) listener(objs);
  });
};
util.inherits(Mongo, EventEmitter);

module.exports = function(options) { return new Mongo(options); };
