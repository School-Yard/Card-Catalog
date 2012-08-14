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

  this.options = options;
  this.router = {};

  // Before `middleware`
  this.before = [];
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
    self.emit('error', {res: res, message: { status: error.status }});
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

// Helper function for accessing slug property
Card.prototype.slug = function slug() {
  return this.slug || '';
};

// Helper function for accessing name property
Card.prototype.name = function name() {
  return this.name || '';
};