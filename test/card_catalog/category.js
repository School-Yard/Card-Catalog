var should = require('should'),
    utils = require('../support/utils');

var category;

// Setup Category instance
before(function(done) {
  utils.setup_catalog(function(catalog) {
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

  describe('filter()', function() {
    var req = utils.mock_stream(),
        res = utils.mock_stream();

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
      utils.create_catalog_object(category, function() {
        utils.load_cards(category);
        done();
      });
    });

    describe('valid path', function() {
      var req = utils.mock_stream(),
          res = utils.mock_stream();

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
      var req = utils.mock_stream(),
          res = utils.mock_stream();

      req.url = 'http://example.com/foobar/example/abc';
      req.method = 'GET';

      it('should return a 404 error', function(done) {
        category.cards.cache.example.on('error', function(err) {
          err.message.status.should.eql(404);
          done();
        });

        category.dispatch(req, res);
      });
    });

  });
});