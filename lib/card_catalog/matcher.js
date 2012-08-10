var Route = require('./route'),
    events = require('events'),
    util = require('util');

/**
 * Helper for matching routes using the Route module.
 *
 * @params
 * uri      {String}              - url.pathname to test matches against
 * routes   {Object}              - Card.routes object containing valid routes
 *
 * Attempts to match a uri string to a card's routes.
 * If a match is found return the route's function and
 * a key/value set of named params.
 */
var Matcher = module.exports = function(uri, routes) {
  this.uri = uri;
  this.routes = routes;
};

util.inherits(Matcher, events.EventEmitter);

Matcher.prototype.match = function match() {
  var keys,
      path,
      route,
      found,
      params,
      matched;

  keys = Object.keys(this.routes);

  for( var i = 0; i < keys.length; i++ ) {
    route = new Route(keys[i]);
    found = route.match(this.uri);
    path = this.routes[keys[i]];

    if (found) {
      params = route.mapKeys(found);
      matched = { route: path, params: params};
      break;
    }
  }

  if(!matched) {
    this.emit('error', {status: 404});
  } else {
    this.emit('matched', matched);
  }
};