var Card = module.exports = function Card(options) {

  if(!(this instanceof Card)) {
    return new Card(options);
  }

  this.options = options;
};

Card.prototype.route = function route(req, res, category, callback) {
  res.writeHead(404, {
    'Content-Type': 'text/html'
  });
  res.end('Called the route method!!');
};

Card.prototype.slug = function() {
  return this.slug || '';
};

Card.prototype.name = function() {
  return this.name || '';
};