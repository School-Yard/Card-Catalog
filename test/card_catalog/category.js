var should = require('should'),
    trapper_keeper = require('trapperkeeper'),
    Category = require('../../lib/card_catalog/category'),
    CardCollection = require('../../lib/card_catalog/collection'),
    plugin = require('../support/example_plugin');

var store, category, record;

// Generic Setup Tasks
function setup(callback) {

  store = trapper_keeper.connect('memory');
  store.connection.on('ready', function() {

    category = new Category({
      connection: store,
      namespace: 'test'
    });

    callback();
  });
}

// Setup Category instance
before(function(done) {
  setup(done);
});


describe('Category', function() {

  describe('Constructor', function() {
    it('should instatiate a storage property', function() {
      should.exist(category.storage);
    });

    it('should set a namespace', function() {
      category.namespace.should.eql('test');
    });
  });

  describe('.load()', function() {
    var record_1 = {name: 'foo', slug: 'foo', plugins: ['Example']},
        record_2 = {name: 'bar', slug: 'bar', plugins: ['Example']};

    before(function(done) {
      category.storage.create(record_1, function() {
        category.storage.create(record_2, function() {
          done();
        });
      });
    });

    it('should load the categories into a cache', function() {
      category.load();
      var keys = Object.keys(category.cache);
      keys.length.should.eql(2);
    });
  });

  describe('.match()', function() {
    var record_1 = {name: 'foo', slug: 'foo', plugins: ['Example']},
        record_2 = {name: 'bar', slug: 'bar', plugins: ['Example']};

    before(function(done) {
      category.storage.create(record_1, function() {
        category.storage.create(record_2, function() {
          done();
        });
      });
    });

    it('should return a category object', function() {
      var slug = 'foo',
          record = {name: 'foo', slug: 'foo', plugins: ['Example'], id: '1'},
          key = category.match(slug);

      key.should.eql(record);
    });
  });

  describe('.dispatch()', function() {

    var test_category = {name: 'example', slug: 'foobar', plugins: ['Example']};

    // Create the test category to dispatch to
    function createCategory(callback) {
      category.storage.create(test_category, function() {
        category.load();
        callback();
      });
    }

    function loadCards() {
      category.cards = new CardCollection({
        cards: [plugin]
      });

      category.cards.load();
    }

    before(function(done) {
      // set an event listener
      category.on('loaded', function() {
        done();
      });

      createCategory(loadCards);
    });

    describe('valid path', function() {
      var mockReq = {
        method: 'GET',
        url: 'http://example.com/foobar/example'
      };

      it('should route the req to the card instance', function(done) {
        category.cards.cache.example.on('routed', function() {
          done();
        });

        category.dispatch(mockReq, {});
      });
    });

    describe('invalid path', function() {
      var mockReq = {
        method: 'GET',
        url: 'http://example.com/foobar/example/abc',
        category: category
      };

      it('should emit a 404 error', function(done) {
        category.cards.cache.example.on('error', function(err) {
          err.status.should.eql(404);
          done();
        });

        category.dispatch(mockReq, {});
      });
    });

  });
});