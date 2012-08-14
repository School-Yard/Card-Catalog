var should = require('should'),
    CardCollection = require('../../lib/card_catalog/collection'),
    plugin = require('../support/example_plugin'),
    helpers = require('../support/helpers');

describe('CardCollection', function() {

  describe('Constructor', function() {

    describe('valid', function() {
      var cards;

      before(function() {
        cards = new CardCollection({
          cards: [plugin]
        });
      });

      it('should create a cache object', function() {
        should.exist(cards.cache);
      });
    });

    describe('invalid', function() {

      it('should throw an error with no cards object', function() {
        (function() {
          new CardCollection({});
        }).should.throw('Must pass in a cards object to the parameters');
      });
    });
  });

  describe('load()', function() {
    var cards;

    before(function() {
      cards = new CardCollection({
        cards: []
      });
      // clear cache to ensure load is working
      cards.cache = {};
    });

    it('should load the cards into a cache', function() {
      cards.cards = [plugin];
      cards.load();

      var keys = Object.keys(cards.cache);
      keys.length.should.eql(1);
      keys[0].should.eql('example');
    });
  });

  describe('match()', function() {
    var cards;

    before(function() {
      cards = new CardCollection({
        cards: [plugin]
      });
      cards.load();
    });

    it('should return a card object', function() {
      var slug = 'example',
          card = cards.match(slug);

      card.name.should.eql('Example');
    });
  });

  describe('dispatch()', function() {
    var cards;

    before(function() {
      cards = new CardCollection({
        cards: [plugin],
        error_handler: function(res, err) {
          return true;
        }
      });
      cards.load();
    });

    describe('valid path', function() {
      var req = helpers.mock_stream(),
          res = helpers.mock_stream();

      req.method = 'GET';
      req.url = 'http://example.com/foobar/example';
      req.category = {
        name: 'example',
        slug: 'foobar',
        plugins: ['Example']
      };

      it('should route the req to the card instance', function(done) {
        cards.cache.example.on('routed', function() {
          done();
        });

        cards.dispatch(req, res);
      });
    });

    describe('invalid path', function() {
      var req = helpers.mock_stream(),
          res = helpers.mock_stream();

      req.method = 'GET';
      req.url = 'http://example.com/foobar/example/abc';
      req.category = {
        name: 'example',
        slug: 'foobar',
        plugins: ['Example']
      };

      it('should emit a 404 error', function(done) {
        cards.cache.example.on('error', function(err) {
          err.message.status.should.eql(404);
          done();
        });

        cards.dispatch(req, res);
      });
    });
  });

});