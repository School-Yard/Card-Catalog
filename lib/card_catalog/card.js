var Matcher = require('./matcher'),
    Server = require('./static'),
    url = require('url'),
    events = require('events'),
    util = require('util'),
    utils = require('./utils');

/**
 * Constructor Method
 */
var Card = module.exports = function Card(options) {

  if(!(this instanceof Card)) {
    return new Card(options);
  }
  options = options || {};

  // Before `middleware`
  this.before = [];

  // Data connection
  this.adapters = options.adapters || null;

  // Collection Reference
  if(options.collection) this.collection = options.collection;

  this.engine = null;
  this.templates = null;

  // Parse the options if name and slug are given
  if(options.name && options.slug) {
    this.parseOptions(options);
  }
  else {
    this.router = {};
  }

};

util.inherits(Card, events.EventEmitter);

/**
 * Main Routing Function
 *
 * @params
 * req {http.ServerRequest} - The server request object
 * res {http.ServerResponse} - The server response object
 *
 * Called from a Card's dispatch method. Responsible
 * for matching up a pathname to a Card's router. It will also
 * attempt to serve up a Card's static assets if a static directory
 * is set.
 */
Card.prototype.route = function route(req, res) {
  var self = this;

  if(this._static) {
    this._static.serve(req, res, function(err) {
      if(err) self.match(req, res);
    });
  }
  else {
    self.match(req, res);
  }
};

/**
 * Match Function
 *
 * @params
 * req {http.ServerRequest} - The server request object
 * res {http.ServerResponse} - The server response object
 *
 * Attempts to match a URL pathname to a route from the
 * route object. If found call the route function with
 * correct scope and parameters.
 */
Card.prototype.match = function match(req, res) {
  var self = this,
      uri = url.parse(req.url).pathname,
      path = utils.splice_path(uri, 2),
      routes = this.router[req.method.toLowerCase()];

  function errorHandler(error) {
    self.emit('error', {res: res, status: error.status, message: 'Error Matching path to route' });
  }

  this.filter(req, res, function() {
    Matcher(path, routes, function(err, matched) {
      if (err) return errorHandler(err);
      matched.route.call(self, req, res, matched.params);
    });
  });
};

/**
 * Set Static Directory
 *
 * @params
 * root {String} - a directory to use for serving files
 * options {Object} - any options available to node-static
 *
 * Sets a directory to serve static assets from. This allows
 * each card to have their own assets including stylesheets and
 * javascript files. Should meet the goal of having stand alone
 * cards that can function independently.
 */
Card.prototype.set_static = function set_static(root, options) {
  options = options || {};

  // root required
  if (!root) throw new Error('set_static() root path required');

  // clear out server instance if it exists
  if(this._static) delete this._static;

  this._static = new Server(root, options);
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
 * to the route function. Functions should focus on modifying the
 * req object but keep the res object intact.
 *
 * Functions can take the connect-style function signature of (req, res, next)
 * or use an evented signature where the req and res object are passed in
 * and a `next` event is emitted on the res object. This makes the middleware
 * compatible with both connect and flatiron middleware functions.
 */
 Card.prototype.filter = function filter(req, res, callback) {
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
          self.emit('error', {res: res, status: 400 , message: err.message });
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

// Helper function for accessing slug property
Card.prototype.slug = function slug() {
  return this.slug || '';
};

// Helper function for accessing name property
Card.prototype.name = function name() {
  return this.name || '';
};

/**
 * Build the Card from an options object
 * Ex:
 *  {
 *    'name': 'Example',
 *    'slug': 'example',
 *    'before': function(req, res, next) {},
 *    'static': 'directory' of {root: dir, option: option}
 *    'routes': {
 *      'get': {
 *        '/': 'index' or function(req, res) {}
 *       }
 *     },
 *    'events': {
 *      'error': function(obj) { //do things }
 *     }
 *  }
 *
 * @param {Object} options
 */
Card.prototype.parseOptions = function parseOptions(options) {
  var self = this,
      router = options.router,
      events = options.events,
      before = options.before;

  //Metadata
  if(!options.name) throw new Error('Name is required for a card');
  if(!options.slug) throw new Error('Slug is required for a card');
  this.name = options.name;
  this.slug = options.slug;

  // Static Files
  if(options.static) {
    if(typeof options.static === 'string') {
      this.set_static(options.static);
    }
    else {
      // Allow an object with options to be passed in
      var dir = options.static.root;
      delete options.static.root;
      this.set_static(dir, options.static);
    }
  }

  // Templates
  if(options.engine) this.engine = options.engine;
  if(options.templates) this.templates = options.templates;

  // Run through `init` function
  if(options.init && (typeof options.init === 'function')) {
    options.init.call(this);
  }

  //Routes
  if(router) {
    self.router = {};

    Object.keys(router).forEach(function(method) {
      self.router[method] = {};
      Object.keys(router[method]).forEach(function(route) {
        //Map the route to the function if it's a string
        if(typeof router[method][route] === 'string') {
          self.router[method][route] = options[router[method][route]];
        }
        else {
          self.router[method][route] = router[method][route] || null;
        }
      });
    });
  }

  //Events
  if(events) {
    Object.keys(events).forEach(function(event) {
      self.on(event, events[event]);
    });
  }

  //Before middleware
  if(before) {
    if(typeof before === 'function') {
      this.before = [ before ];
    }
    else {
      this.before = before;
    }
  }

  return this;
};