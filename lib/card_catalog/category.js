var trapper_keeper = require('trapperkeeper'),
    url = require('url');

var Category = module.exports = function Category(options) {

  if(!(this instanceof Category)) {
    return new Category(options);
  }

  this.cache = {};

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
  });
};

/**
 * Dispatch
 *
 * @params
 * req      {Object}   - the http request object
 * res      {Object}   - the http response object
 * callback {Function} - a callback to run if there are no matches
 *
 * Takes a url and attempts to match it to a slug from the
 * catalog categories. If a match pass it off to a card lookup,
 * if no match return a 404 status.
 */
Category.prototype.dispatch = function(req, res, callback) {
  var path = url.parse(req.url).pathname,
      slug = getSlug(path),
      category;

  category = this.match(slug);
  
  if(category && this.cards) {
    // Send to card dispatcher
    this.cards.dispatch(req, res, category, callback);
  } else {
    callback({staus: 404});
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

/**
 * Get Slug
 *
 * @params uri {String} - a url.pathname string.
 *
 * Takes a uri string and returns the slug if there is one.
 */
function getSlug(uri) {
  var parts = uri.split('/'),
      slug;

  parts.shift();
  return parts.length > 0 ? parts[0] : '';
}