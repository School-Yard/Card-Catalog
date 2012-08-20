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
  this.adapters = options.adapters || {};

  // Before `middleware`
  this.before = [];

  // Error Handler
  this.on('error', function(err) {
    self.error_handler(err.res, err.status, err.message);
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

  this.storage.find({published: true}, function(err, categories) {
    categories.forEach(function(category) {
      var key = category.slug || self.increment().toString();
      self.cache[key] = category;
    });

    self.emit('loaded');
  });
};

/**
 * Attach
 *
 * @params
 * category {Object} - a new category object to attach
 *
 * Attach a new category slug to the router dynamically
 */
Category.prototype.attach = function attach(category) {
  if(category.published === true) this.cache[category.slug] = category;
};

/**
 * Detach
 *
 * @params
 * category {Object/String} - a category object/slug to remove
 *
 * Remove a category slug from the router
 */
Category.prototype.detach = function detach(category) {
  if(typeof category === 'object') {
    delete this.cache[category.slug];
  } else {
    delete this.cache[category];
  }
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
  options.adapters = options.adapters || this.adapters;
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
 * req {http.ServerRequest} - The server request object
 * res {http.ServerResponse} - The server response object
 *
 * Takes a url and attempts to match it to a slug from the
 * catalog categories. If a match pass it off to a card lookup,
 * if no match emit an error.
 */
Category.prototype.dispatch = function(req, res) {
  var path = url.parse(req.url).pathname,
      slug = utils.slugify(path, 1),
      self = this,
      category;

  category = this.match(slug);

  if(category && this.cards) {
    // Append the category to the request object
    req.category = category;

    // Filter through any `middleware` defined
    this.filter(req, res, function() {
      self.cards.dispatch(req, res);
    });

  } else {
    this.emit('error', {res: res, status: 404, message: 'Path Not Found' });
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
 * Filter a request through before functions
 *
 * @params
 * req {http.ServerRequest} - The server request object
 * res {http.ServerResponse} - The server response object
 * callback {Function} - A callback to return
 *
 * Runs a request through a set of functions before passing it off
 * to the cards dispatcher. Functions should focus on modifying the
 * req object but keep the res object intact.
 *
 * Functions can take the connect-style function signature of (req, res, next)
 * or use an evented signature where the req and res object are passed in
 * and a `next` event is emitted on the res object. This makes the middleware
 * compatible with both connect and flatiron middleware functions.
 */
 Category.prototype.filter = function filter(req, res, callback) {
  var self = this,
      len = this.before.length;

  (function dispatch(i) {

    if (++i === len) return callback();

    res.once('next', dispatch.bind(null, i));

    // Using a connect-compatible middleware with (req, res, next) signature
    // or (req, res) and manually emit a `next` event on the res object.
    if (self.before[i].length === 3) {
      self.before[i](req, res, function(err) {
        if (err) {
          self.emit('error', err);
        } else {
          res.emit('next');
        }
      });
    }
    else {
      self.before[i](req, res);
    }

  })(-1); // start at -1 so the first iterator ups the index to 0
 };
