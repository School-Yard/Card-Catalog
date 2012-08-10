var should = require("should"),
    Matcher = require("../../lib/card_catalog/matcher");

var router = {
  '/:id': function() {}
};

describe('Match', function(){

  describe('valid path', function(){
    var matcher = new Matcher('/123', router);

    it('should emit a matched route', function(done) {
      matcher.on('matched', function(match) {
        match.route.should.be.a('function');
        match.params.id.should.eql('123');
        done();
      });

      matcher.match();
    });
  });

  describe('invalid path', function(){
    var matcher = new Matcher('/123/edit', router);

    it('should emit a 404 error', function(done) {
      matcher.on('error', function(err) {
        err.status.should.eql(404);
        done();
      });

      matcher.match();
    });
  });

});