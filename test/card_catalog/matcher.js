var should = require("should"),
    Matcher = require("../../lib/card_catalog/matcher");

var router = {
  '/:id': function() {}
};

describe('Match', function(){

  describe('valid path', function(){
    it('should match a route', function(done) {
      Matcher('/123', router, function(err, matched) {
        matched.route.should.be.a('function');
        matched.params.id.should.eql('123');
        done();
      });
    });
  });

  describe('invalid path', function(){
    it('should send a 404 error', function(done) {
      Matcher('/123/edit', router, function(err, matched) {
        err.status.should.eql(404);
        done();
      });
    });
  });

});