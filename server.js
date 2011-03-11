var express = require('express')
  , twitter = require('twitter-js')(
      '5MvHhIgH1arjKA5HdZecw',
      'z8KAFzE1QM9EVXz5AkjMtvJgb2mMelhhP3nJRQ1ws')
  , mongo = require('./mongo')({
      name: 'commontweet',
      collections: ['users', 'statuses'] })
  , app = express.createServer(
      express.logger(),
      express.bodyParser(),
      express.cookieParser(),
      express.session({ secret: "rm5NxTVdmcpHquM9b9e4eZY3kD5uSaY" }),
      express.methodOverride(),
      express.errorHandler({ dumpExceptions: true, showStack: true }))
  , nlp = require('./nlp')
  , noop = function() {};

mongo.on('ready', function(db) {

  app.get('/', function(req, res) {
    if (!req.session.twitter_id) return res.redirect('/auth');

    db.users.findOne({ twitter_id: req.session.twitter_id }, function(error, user) {
      if (error) throw error;

      twitter.apiCall('GET', '/statuses/friends_timeline.json', { token: user.token, count: 200, include_rts: 1 }, function(error, statuses) {
        if (error) throw error;

        statuses.forEach(function(status) { status.text_parsed = nlp.parse(status.text); });
        res.render('index.jade', { locals: { user: user, statuses: statuses }});
      });
    });
  });

  app.get('/auth', function(req, res) {
    twitter.getAccessToken(req, res, function(error, token) {
      if (error) throw error;

      twitter.apiCall('GET', '/account/verify_credentials.json', { token: token }, function(error, user) {
        if (error) throw error;

        var id = user.id;
        delete user.id;
        user.twitter_id = id;

        user.token = token;

        db.users.update({ twitter_id: id }, user, { upsert: true }, function(error, record) {
          if (error) throw error;

          req.session.twitter_id = id;
          res.redirect('/');
        });
      });
    });
  });

  app.listen(parseInt(process.env.PORT) || 8000);

  db.users.ensureIndex('twitter_id', true, noop);
  db.statuses.ensureIndex('twitter_id', true, noop);
});
