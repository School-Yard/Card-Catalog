var card_catalog = require('../../lib'),
    util = require('util');

var Example = module.exports = function Example(options) {
  this.name = "Example";
  this.slug = "example";

  // Create the Example routing table
  this.router = {
    'get': {
      '/': this.index
    }
  };
};

util.inherits(Example, card_catalog.card);

Example.prototype.index = function root(req, res, category) {
  req.fn(category);
};