var should = require("should"),
    Route = require("../../lib/card_catalog/route");

describe('Route', function(){
  var router;

  beforeEach(function(){
    router = new Route("/test/route/:number/abc/:string");
  });

  describe('.match()', function(){
    it('should get captures based on path string', function(){
      var path = "/test/route/123/abc/def",
          captures = router.match(path);
      
      // Delete properties we don't care about
      delete captures.index;
      delete captures.input;

      captures.length.should.eql(3);
      captures[0].should.eql('/test/route/123/abc/def');
      captures[1].should.eql('123');
      captures[2].should.eql('def');
    });

    it('should not match an incorrect pathname', function() {
      var path = "/test/route/123",
          captures = router.match(path);

      should.not.exist(captures);      
    });
  });

  describe('.mapKeys()', function(){
    beforeEach(function(){
      router.match('/test/route/123/abc/def');
    });

    it('should match named parameters to path values', function(){
      var params = router.mapKeys(),
          keys = Object.keys(params);
   
      keys.length.should.equal(2);
      params.number.should.equal('123');
      params.string.should.equal('def');
    });
  });

});