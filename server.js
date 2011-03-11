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
        var stems = new StemAggregator();
        if (error) throw error;

        statuses.forEach(function(status) {
          status.text_parsed = nlp.parse(status.text);
          stems.addTokens(status.text_parsed);
        });

        res.render('index.jade', { locals: {
          user: user, statuses: statuses, stems: stems }});
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

function StemAggregator() {
  this.stems = {};
}

StemAggregator.prototype.addTokens = function(tokens) {
  var self = this;
  tokens.forEach(function(token) {
    if (token && token.stem && !token.stopword) {
      if (token.stem in self.stems) {
        self.stems[token.stem] += 1;
      } else {
        self.stems[token.stem] = 1;
      }
    }
  });
};

StemAggregator.prototype.topStems = function(options) {
  var self = this
    , page = options && options.page || 1
    , per_page = options && options.per_page || 10
    , start = (page - 1) * per_page
    , end = start + per_page
    , ret = [];

  for (var k in self.stems) {
    ret.push({ stem: k, count: self.stems[k] });
  }

  return ret.sort(function(a, b) {
    return (a.count === b.count ? 0 : (a.count < b.count ? 1 : -1));
  }).slice(start, end);
};
