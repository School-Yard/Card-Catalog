var should = require('should'),
    helpers = require('../support/helpers');

var category;

// Setup Category instance
before(function(done) {
  helpers.setup_catalog(function(catalog) {
    category = catalog;
    done();
  });
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
    var record_1 = {name: 'foo', slug: 'foo', published: true, plugins: ['Example']},
        record_2 = {name: 'bar', slug: 'bar', published: true, plugins: ['Example']},
        record_3 = {name: 'foobar', slug: 'foobar', published: false, plugins: []};

    before(function(done) {
      category.storage.create(record_1, function() {
        category.storage.create(record_2, function() {
          category.storage.create(record_3, function() {
            done();
          });
        });
      });
    });

    it('should load the categories into a cache', function() {
      category.load();
      var keys = Object.keys(category.cache);
      keys.length.should.not.eql(0);
    });

    it('should not load unpublished categories', function() {
      var keys = Object.keys(category.cache);
      keys[0].should.eql('foo');
      keys[1].should.eql('bar');
      keys.length.should.eql(2);
    });
  });

  describe('.match()', function() {
    var record_1 = {name: 'foo', slug: 'foo', published: true, plugins: ['Example']},
        record_2 = {name: 'bar', slug: 'bar', published: true, plugins: ['Example']};

    before(function(done) {
      category.cache = {};
      category.connection.store = {};

      category.storage.create(record_1, function() {
        category.storage.create(record_2, function() {
          category.load();
          done();
        });
      });
    });

    it('should return a category object', function() {
      var slug = 'foo',
          record = {name: 'foo', slug: 'foo', published: true, plugins: ['Example'], id: category.cache.foo.id},
          key = category.match(slug);

      key.should.eql(record);
    });
  });

  describe('filter()', function() {
    var req = helpers.mock_stream(),
        res = helpers.mock_stream();

    before(function() {
      category.before = [
        function(req, res) {
          res.emit('next');
        },
        function(req, res, next) {
          next();
        }
      ];
    });

    it('should call each function in before array', function(done) {
      var events = 0;
      res.on('next', function() { events++; });

      category.filter(req, res, function() {
        events.should.eql(2);
        done();
      });
    });
  });

  describe('.dispatch()', function() {

    before(function(done) {
      helpers.create_catalog_object(category, function() {
        helpers.load_cards(category);
        done();
      });
    });

    describe('valid path', function() {
      var req = helpers.mock_stream(),
          res = helpers.mock_stream();

      req.url = 'http://example.com/foobar/example';
      req.method = 'GET';

      it('should route the req to the card instance', function(done) {
        category.cards.cache.example.on('routed', function() {
          done();
        });

        category.dispatch(req, res);
      });
    });

    describe('invalid path', function() {
      var req = helpers.mock_stream(),
          res = helpers.mock_stream();

      req.url = 'http://example.com/foobar/example/abc';
      req.method = 'GET';

      it('should return a 404 error', function(done) {
        category.cards.cache.example.on('error', function(err) {
          err.status.should.eql(404);
          done();
        });

        category.dispatch(req, res);
      });
    });

  });
});