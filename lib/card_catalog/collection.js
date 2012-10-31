var events = require('events'),
    Card = require('./card'),
    util = require('util'),
    utils = require('./utils'),
    url = require('url'),
    error_handler = require('./error_handler');

/**
 * Constructor
 *
 * @params
 * options: {
 *   cards {Array} - a collection of card modules read from the filesystem
 * }
 */
var CardCollection = module.exports = function(options) {

  if(!(this instanceof CardCollection)) {
    return new CardCollection(options);
  }

  var self = this;

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
  this.adapters = options.adapters || null;
  this.error_handler = options.error_handler || error_handler.error;

  this.on('error', function(err) {
    self.error_handler(err.res, err.status, err.message);
  });
};

util.inherits(CardCollection, events.EventEmitter);

/**
 * Warmup Cache
 *
 * Load all the cards into a memory cache.
 */
CardCollection.prototype.load = function() {
  var self = this,
      module,
      key;

  this.cards.forEach(function(card) {
    if(typeof card === 'function') {
      module = new card({
        adapters: self.adapters,
        collection: self.cache
      });
    }
    else {
      card.adapters = card.adapters || self.adapters;
      card.collection = self.cache;
      module = new Card(card);
    }

    key = module.slug || self.increment().toString();
    self.cache[key] = module;

    // Allow a cards errors to bubble up to use the global
    // event handler
    module.on('error', function(err) {
      self.emit('error', err);
    });
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
CardCollection.prototype.dispatch = function(req, res) {
  var path = url.parse(req.url).pathname,
      slug = utils.slugify(path, 2),
      card,
      enabled;

  // If the category has an index card and no card slug, route to index card
  if((!slug || slug === '') && !!req.category.index) {
    card = this.match(req.category.index);
  }
  else {
    card = this.match(slug);
  }

  // Determine if the card is attached and published
  enabled = req.category.plugins.some(function(plugin) {
    return plugin.hasOwnProperty(card.name) && plugin[card.name].published === true;
  });

  // Card is a function and the card name in an enabled plugin for the category
  if(card && typeof(card.route) === 'function' && enabled) {
    res.card = card.slug;
    card.route(req, res); // Invoke the cards `route` function
  } else {
    this.emit('error', { res: res, status: 404, message: 'Not Found' });
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
CardCollection.prototype.match = function(slug) {
  if( slug in this.cache) {
    return this.cache[slug];
  } else {
    return false;
  }
};
