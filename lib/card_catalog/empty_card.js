var Matcher = require('./matcher');

var Card = module.exports = function Card(options) {

  if(!(this instanceof Card)) {
    return new Card(options);
  }

  this.options = options;
  this.router = {};
};

Card.prototype.route = function route(req, res, category, path, callback) {
  var routes = this.router[req.method.toLowerCase()];

  Matcher(path, routes, function(err, obj) {
    if(err) return callback(err);
    obj.route.call(this, req, res, category, obj.params);
  });
};

Card.prototype.slug = function slug() {
  return this.slug || '';
};

Card.prototype.name = function name() {
  return this.name || '';
};
