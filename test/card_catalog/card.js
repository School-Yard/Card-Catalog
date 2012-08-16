var should = require('should'),
    Card = require('../../lib').Card;
    helpers = require('../support/helpers'),
    object_plugin = require('../support/object_plugin'),
    function_plugin = require('../support/example_plugin');

var card = new Card();

describe('Card', function() {
  var function_card, object_card;

  before(function() {
    function_card = new function_plugin();
    object_card = new Card(object_plugin);
  });

  describe('filter()', function() {
    var req = helpers.mock_stream(),
        res = helpers.mock_stream();

    before(function() {
      card.before = [
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

      card.filter(req, res, function() {
        events.should.eql(2);
        done();
      });
    });
  });

  describe('object plugin should be equal to the functional plugin and', function() {
    it('name should be equal', function() {
      function_card.name.should.equal(object_card.name);
    });

    it('slug should be equal', function() {
      function_card.slug.should.equal(object_card.slug);
    });

    it('static root directory should be equal', function() {
      function_card._static.root.should.equal(object_card._static.root);
    });

    it('should run an objects init function', function() {
      object_card.initialized.should.equal(true);
    });

    it('routes should be equal', function() {
      //Validate that the route object is the same
      Object.keys(function_card.router).forEach(function(method) {
        object_card.router.should.have.property(method);

        Object.keys(function_card.router[method]).forEach(function(route) {
          object_card.router[method].should.have.property(route);
        });
      });
    });
  });

  describe('event listeners', function() {
    it('should bind properly', function() {
      object_card.listeners('error').should.not.be.empty;
    });
  });

  describe('storage connection', function() {
    var adapters, card;

    before(function() {
      adapters = {};
      card = new Card({ adapters: adapters });
    });

    it('should expose adapters from options', function() {
      card.adapters.should.equal(adapters);
    });

    it('should be null if not passed in options', function() {
      var card = new Card();
      should.not.exist(card.connection);
    });
  });

});