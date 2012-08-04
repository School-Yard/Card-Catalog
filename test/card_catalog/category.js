var should = require('should'),
    trapper_keeper = require('trapperkeeper'),
    Category = require('../../lib/card_catalog/category'),
    Cards = require('../../lib/card_catalog/cards'),
    plugin = require('../support/example_plugin');

var store = trapper_keeper.connect('memory'),
    category,
    record;

describe('Category', function() {

  before(function(done) {
    store.connection.on('ready', function() {
      category = new Category({
        connection: store,
        namespace: 'test'
      });

      done();
    });

    store.connection.ready();
  });

  describe('Constructor', function() {
    it('should instatiate a storage property', function() {
      should.exist(category.storage);
    });

    it('should set a namespace', function() {
      category.namespace.should.eql('test');
    });
  });

  describe('load()', function() {

    before(function(done) {
      category.storage.create({name: 'foo', slug: 'foo', plugins: ['example']}, function() {
        category.storage.create({name: 'bar', slug: 'bar', plugins: ['example']}, function() {
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

  describe('match()', function() {

    before(function(done) {
      category.storage.create({name: 'foo', slug: 'foo', plugins: ['example']}, function() {
        category.storage.create({name: 'bar', slug: 'bar', plugins: ['example']}, function() {
          done();
        });
      });
    });

    it('should return a category object', function() {
      var slug = 'foo',
          record = {name: 'foo', slug: 'foo', plugins: ['example'], id: '1'},
          key = category.match(slug);

      JSON.parse(key).should.eql(record);
    });
  });

  describe('dispatch()', function() {

    before(function(done) {
      category.storage.create({name: 'example', slug: 'foobar', plugins: ['example']}, function() {
        category.load();
        category.cards = new Cards({
          cards: [plugin]
        });
        done();
      });
    });

    describe('valid path', function() {
      var mockReq = { 
        method: 'GET',
        url: 'http://example.com/foobar/example'
      };

      it('should call dispatch method on Cards', function(done) {
        mockReq.fn = function(site) {
          JSON.parse(site).slug.should.eql('foobar');
          done();
        };

        category.dispatch(mockReq, {}, function() {});
      });
    });

    describe('invalid path', function() {
      var mockReq = { 
        method: 'GET',
        url: 'http://example.com/foobar/example/abc'
      };

      it('should call dispatch method on Cards', function(done) {
        var err = function(err) {
          err.status.should.eql(404);
          done();
        };

        category.dispatch(mockReq, function() {}, err);
      });
    });

  });

});