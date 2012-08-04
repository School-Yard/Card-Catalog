var Route = require('./route');

/**
 * Helper for matching routes using the Route module.
 *
 * @params
 * uri      {String}              - url.pathname to test matches against
 * routes   {Object}              - Card.routes object containing valid routes
 * callback {Function}            - a callback function to run
 *
 * Attempts to match a uri string to a card's routes.
 * If a match is found return the route's function and
 * a key/value set of named params.
 */
module.exports = function(uri, routes, callback) {
  var keys,
      path,
      route,
      found,
      params,
      matched;

  keys = Object.keys(routes);

  for( var i = 0; i < keys.length; i++ ) {
    route = new Route(keys[i]);
    found = route.match(uri);
    path = routes[keys[i]];

    if (found) {
      params = route.mapKeys(found);
      matched = { route: path, params: params};
      break;
    }
  }

  if(!matched) return callback({status: 404});
  return callback(null, matched);
};