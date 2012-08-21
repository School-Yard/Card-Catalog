var should = require('should'),
    helpers = require('../support/helpers'),
    clone = require('clone');

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

  describe('.attach()', function() {
    var record = {name: 'append', slug: 'append', published: true, plugins: ['Example']};

    it('should attach a category to the cache', function() {
      category.cache = {};
      category.attach(record);
      should.exist(category.cache['append']);
    });

    it('should not attach an unpublished category', function() {
      category.cache = {};
      record.published = false;
      category.attach(record);
      should.not.exist(category.cache['append']);
    });

  });

  describe('.detach()', function() {
    var record = {name: 'append', slug: 'append', published: true, plugins: ['Example']};

    before(function() {
      category.attach(record);
    });

    it('should detach a category from the cache when an object', function() {
      category.detach(record);
      should.not.exist(category.cache['append']);
    });

    it('should detach a category from the cache when a string', function() {
      category.detach('append');
      should.not.exist(category.cache['append']);
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

    describe('a published category', function() {
      it('should return a category object', function() {
        var slug = 'foo',
            record = {name: 'foo', slug: 'foo', published: true, plugins: ['Example'], id: category.cache.foo.id},
            key = category.match(slug);

        key.should.eql(record);
      });
    });

    describe('an un-published category', function() {
      before(function() {
        category.cache.foo.published = false;
      });

      it('should return false', function() {
        var slug = 'foo';
        category.match(slug).should.eql(false);
      });
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

    describe('to published route with a', function() {
      var obj;

      before(function(done) {
        obj = clone(category);

        helpers.create_catalog_object(obj, function() {
          helpers.load_cards(obj);
          done();
        });
      });

      describe('valid path', function() {
        var req = helpers.mock_stream(),
            res = helpers.mock_stream();

        req.url = 'http://example.com/foobar/example';
        req.method = 'GET';

        it('should route the req to the card instance', function(done) {
          obj.cards.cache.example.on('routed', function() {
            done();
          });

          obj.dispatch(req, res);
        });
      });

      describe('invalid path', function() {
        var req = helpers.mock_stream(),
            res = helpers.mock_stream();

        req.url = 'http://example.com/foo/bar';
        req.method = 'GET';

        it('should return a 404 error', function(done) {
          obj.on('error', function(err) {
            err.status.should.eql(404);
            done();
          });

          obj.dispatch(req, res);
        });
      });
    });

    describe('to an unpublished route', function() {
      var obj;

      before(function(done) {
        obj = clone(category);

        helpers.create_catalog_object(obj, function() {
          helpers.load_cards(obj);

          // Set published = false
          obj.cache.foobar.published = false;

          done();
        });
      });

      describe('with a valid path', function() {
        var req = helpers.mock_stream(),
            res = helpers.mock_stream();

        req.url = 'http://example.com/foobar/example';
        req.method = 'GET';

        it('should return a 404 error', function(done) {
          obj.on('error', function(err) {
            err.status.should.eql(404);
            done();
          });

          obj.dispatch(req, res);
        });
      });
    });
  });
});