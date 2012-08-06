var should = require('should'),
    Cards = require('../../lib/card_catalog/cards'),
    plugin = require('../support/example_plugin');

describe('Cards', function() {

  describe('Constructor', function() {

    describe('valid', function() {
      var cards;

      before(function() {
        cards = new Cards({
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
          new Cards({});
        }).should.throw('Must pass in a cards object to the parameters');
      });
    });
  });

  describe('load()', function() {
    var cards;

    before(function() {
      cards = new Cards({
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
      cards = new Cards({
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
      cards = new Cards({
        cards: [plugin]
      });
      cards.load();
    });

    describe('valid path', function() {
      var mockReq = {
        method: 'GET',
        url: 'http://example.com/foobar/example'
      };

      var category = JSON.stringify({name: 'example', slug: 'foobar', plugins: ['example']});

      it('should call dispatch method on Cards', function(done) {
        mockReq.category = category;
        mockReq.fn = function(category) {
          JSON.parse(category).slug.should.eql('foobar');
          done();
        };

        cards.dispatch(mockReq, {}, function() {});
      });
    });

    describe('invalid path', function() {
      var mockReq = {
        method: 'GET',
        url: 'http://example.com/foobar/example/abc'
      };

      var category = {name: 'example', slug: 'foobar', plugins: ['example']};

      it('should call dispatch method on Cards', function(done) {
        mockReq.category = category;
        var err = function(err) {
          err.status.should.eql(404);
          done();
        };

        cards.dispatch(mockReq, function() {}, err);
      });
    });
  });

});