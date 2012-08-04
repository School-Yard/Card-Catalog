var should = require("should"),
    Matcher = require("../../lib/card_catalog/matcher");

var router = {
  '/:id': function() {}
};

function matcher(path, callback) {
  Matcher(path, router, callback);
}

describe('Match', function(){
  
  describe('valid path', function(){
    var err_status, route_obj;

    before(function(done) {
      var path = '/123';
      matcher(path, function(err, route) {
        if(err) err_status = err;
        if(!err) route_obj = route;
        done();
      });
    });

    it('should return a route function', function() {
      should.not.exist(err_status);
      route_obj.route.should.be.a('function');
    });

    it('should set the id param', function() {
      route_obj.params.id.should.eql('123');
    });

  });

  describe('invalid path', function(){
    var err_status, route_obj;

    before(function(done) {
      var path = '/123/edit';
      matcher(path, function(err, route) {
        if(err) err_status = err;
        route_obj = route;
        done();
      });
    });

    it('should return an error status', function() {
      should.not.exist(route_obj);
      err_status.status.should.eql(404);
    });

  });

});