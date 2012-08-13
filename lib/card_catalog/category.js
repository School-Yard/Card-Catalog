var trapper_keeper = require('trapperkeeper'),
    CardCollection = require('./collection');
    events = require('events'),
    util = require('util'),
    utils = require('./utils'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
    error_handler = require('./error_handler');

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

  var self = this;

  this.cache = {};
  this.cards = options.cards || null;
  this.error_handler = options.error_handler || error_handler.error;

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

  this.on('error', function(err) {
    self.error_handler(err.res, err.message);
  });

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
      self.cache[key] = category;
    });

    self.emit('loaded');
  });
};

/**
 * Add cards to the current instance
 *
 * @params
 * options {Object} - options to pass into Cards instance
 *
 * @return {this}
 */
Category.prototype.addCards = function(options) {
  options.error_handler = this.error_handler;
  this.cards = new CardCollection(options);
  this.cards.load();

  return this;
};

/**
 * Add cards from a directory
 * Example:
 *     cards/
 *        /card_1/
 *            /index.js
 *        /card_2
 *            /index.js
 *
 * @param {String} dir
 */
Category.prototype.addCardDirectory = function(pth) {
  var directory = path.resolve(pth);

  if(fs.existsSync(directory)) {
    var cards = [];
    fs.readdirSync(pth).forEach(function(dir) {
      var card = path.join(directory, dir);

      try {
        cards.push(require(card));
      }
      catch(e) {
        console.warn('Error loading card at ' + card);
      }
    });

    return this.addCards({ cards: cards });
  }
  else {
    throw new Error('Invalid card directory');
  }
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
    this.emit('error', {res: res, message: { status:404 }});
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
