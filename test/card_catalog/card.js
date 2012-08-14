var should = require('should'),
    Card = require('../../lib').Card;
    helpers = require('../support/helpers');

var card = new Card();

describe('Card', function() {

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

});