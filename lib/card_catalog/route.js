
/**
 *  Taken and modified from the express router code by TJ
 *  https://github.com/visionmedia/express/blob/master/lib/router/route.js
 */

module.exports = Route;

 /**
 * Route Constructor
 *
 * @params
 * path {String} - a path from routing table
 */
function Route(path) {
  this.path = path;
  this.regexp = normalize(path, this.keys = []);
}

/**
 * Match
 *
 * @params
 * path {String} - a url to match against
 *
 * Checks if a string matches the path using the
 * the routes regexp.
 *
 * returns the capture groups.
 */
Route.prototype.match = function(path){
  this.captures = this.regexp.exec(path);
  return this.captures;
};

/**
 * Map Keys
 *
 * Matches param identifiers in a route to their
 * url pathname values. Sets this.params to the
 * key/value pairs.
 *
 * ex: /record/:id would return
 *     [record: '123'] for the pathname /record/123
 *
 *  Returns an array of key/values
 */
Route.prototype.mapKeys = function() {
  var keys, val, captures;

  keys = this.keys;
  captures = this.captures || [];
  this.params = [];

  for (var i = 1; i < captures.length; i++) {
    var key = keys[i-1];
    val = 'string' == typeof captures[i] ? decodeURIComponent(captures[i]) : captures[i];
    if (key) {
      this.params[key.name] = val;
    } else {
      this.params.push(val);
    }
  }

  return this.params;
};


/**
 * Normalize
 *
 * @params
 * path {String} - a path from routing table
 * keys {Array}  - an array to set the values in
 *
 * Returns a regular expression
 */
function normalize(path, keys) {
  path = path
  .concat('/?')
  .replace(/\/\(/g, '(?:/')
  .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
      keys.push({ name: key, optional: !! optional });
      slash = slash || '';
      return ''
        + (optional ? '' : slash)
        + '(?:'
        + (optional ? slash : '')
        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
        + (optional || '');
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.*)');
  return new RegExp('^' + path + '$', 'i');
}