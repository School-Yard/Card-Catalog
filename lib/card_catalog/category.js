var trapper_keeper = require('trapperkeeper'),
    CardCollection = require('./collection');
    events = require('events'),
    util = require('util'),
    utils = require('./utils'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');

/**
 * Constructor
 *
 * @params
 * options: {
 *   connection {Object} - a trapper_keeper data connection, defaults to memory
 *   namespace  {String} - a namespace to find categories in the data store, defaults to 'cardCatalog'
 * }
 */
var Category = module.exports = function Category(options) {

  if(!(this instanceof Category)) {
    return new Category(options);
  }

  this.cache = {};
  this.cards = null;

  // Use a counter to keep track of indexes
  var counter = 0;
  this.increment = function() {
    return ++counter;
  };

  if(options.connection) {
    this.connection = options.connection;
  } else {
    this.connection = trapper_keeper.connect('memory');
  }

  this.namespace = options.namespace || 'cardCatalog';
  this.storage = this.connection.resource(this.namespace);
};

util.inherits(Category, events.EventEmitter);

/**
 * Warmup Cache
 *
 * Load all the site slugs into a memory cache to make
 * lookups fast.
 */
Category.prototype.load = function() {
  var self = this;

  this.storage.all(function(err, categories) {
    categories.forEach(function(category) {
      var key = category.slug || self.increment().toString();
      self.cache[key] = JSON.stringify(category);
    });

    self.emit('loaded');
  });
};

/**
 * Dispatch
 *
 * @params
 * req      {Object}   - the http request object
 * res      {Object}   - the http response object
 *
 * Takes a url and attempts to match it to a slug from the
 * catalog categories. If a match pass it off to a card lookup,
 * if no match emit an error.
 */
Category.prototype.dispatch = function(req, res) {
  var path = url.parse(req.url).pathname,
      slug = utils.slugify(path, 1),
      category;

  category = this.match(slug);

  if(category && this.cards) {
    // Append the category to the request object
    req.category = category;

    // Send to card dispatcher
    this.cards.dispatch(req, res);
  } else {
    this.emit('error', {status:404});
  }
};

/**
 * Match route
 *
 * @params
 * slug {String} - a slug to match against
 *
 * Matches a slug to a key in the cache object.
 * returns the cache key or false
 */
Category.prototype.match = function(slug) {
 if( slug in this.cache) {
  return this.cache[slug];
 } else {
  return false;
 }
};