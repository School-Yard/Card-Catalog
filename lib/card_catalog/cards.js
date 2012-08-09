var trapper_keeper = require('trapperkeeper'),
    events = require('events'),
    util = require('util'),
    utils = require('./utils'),
    url = require('url');

/**
 * Constructor
 *
 * @params
 * options: {
 *   cards {Array} - a collection of card modules read from the filesystem
 * }
 */
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

  this.cards = options.cards;
};

util.inherits(Cards, events.EventEmitter);

/**
 * Warmup Cache
 *
 * Load all the cards into a memory cache.
 */
Cards.prototype.load = function() {
  var self = this;

  this.cards.forEach(function(card) {
    var module = new card(),
        key = module.slug || self.increment().toString();

    self.cache[key] = module;
  });
};

/**
 * Dispatch
 *
 * @params
 * req {http.ServerRequest}  - the http request object
 * res {http.ServerResponse} - the http response object
 *
 * Takes a url and attempts to match it to a plugin attached
 * to a category. If a match pass it off to the card for further
 * processing, if no match emit an error.
 */
Cards.prototype.dispatch = function(req, res) {
  var path = url.parse(req.url).pathname,
      slug = utils.slugify(path, 2),
      card;

  card = this.match(slug);

  if(card && typeof(card.route) === 'function') {
    // Invoke the cards `route` function
    card.route(req, res);
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
Cards.prototype.match = function(slug) {
 if( slug in this.cache) {
  return this.cache[slug];
 } else {
  return false;
 }
};