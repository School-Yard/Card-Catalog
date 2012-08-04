var trapper_keeper = require('trapperkeeper'),
    url = require('url');

var Cards = module.exports = function Cards(options) {

  if(!(this instanceof Cards)) {
    return new Cards(options);
  }

  this.cache = {};

  // Use a counter to keep track of indexes
  var counter = 0;
  this.increment = function() {
    return ++counter;
  };

  if(!options.cards) {
    throw new Error('Must pass in a cards object to the parameters');
  }

  this.load(options.cards);
  return this;
};

/**
 * Warmup Cache
 *
 * Load all the cards into a memory cache.
 */
Cards.prototype.load = function(cards) {
  var self = this;

  cards.forEach(function(card) {
    var module = new card(),
        key = module.slug || self.increment().toString();
    
    self.cache[key] = module;
  });
};

/**
 * Dispatch
 *
 * @params
 * req      {Object} - the http request object
 * res      {Object} - the http response object
 * category {Object} - the matched category
 *
 * Takes a url and attempts to match it to a plugin attached
 * to a category. If a match pass it off to the card for further
 * processing, if no match return a 404 status.
 */
Cards.prototype.dispatch = function(req, res, category, callback) {
  var path = url.parse(req.url).pathname,
      slug = getSlug(path),
      card,
      cardPath = getCardPath(path);

  card = this.match(slug);

  if(card && typeof(card.route) === 'function') {
    // Invoke the cards `route` function
    card.route(req, res, category, cardPath, callback);
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
Cards.prototype.match = function(slug) {
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
 * Takes a uri string and returns the card slug if there is one.
 */
function getSlug(uri) {
  var parts = uri.split('/'),
      slug;

  parts.shift();
  return parts.length > 1 ? parts[1] : '';
}

/**
 * Get card path
 *
 * @params uri {String} - a url.pathname string
 *
 * Removes the category and card slug from the uri string
 * to send to the cards route method.
 *
 * returns a path string
 */
function getCardPath(uri) {
  var parts = uri.split('/');

  parts.splice(0, 3);
  return '/' + parts.join().replace(/,/g, '/');
}
