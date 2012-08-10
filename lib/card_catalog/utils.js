var utils = module.exports;

/**
 * Splice Path
 *
 * @params
 * uri {String} - a url.pathname string
 * length {Integer} - how much of the path to split off
 *
 * Splices sections of a url.pathname off. Length should
 * be the number of sections to cut off.
 *
 * returns a path string
 */
utils.splice_path = function(uri, length) {
  var parts = uri.split('/');

  parts.splice(0, length + 1);
  return '/' + parts.join().replace(/,/g, '/');
};


/**
 * Get Slug
 *
 * @params uri {String} - a url.pathname string.
 * @params idx {Number} - position to extract
 *
 * Takes a uri string and returns the card slug if there is one.
 */
utils.slugify = function(uri, idx) {
  var slug = uri.split('/');
  return slug && slug[idx] ? slug[idx] : '';
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
utils.normalize = function(path, keys) {
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
};


// Helper function for removing pieces from a url.pathname
utils.cleanPathname = function(pathname) {
  var parts = pathname.split('/');
  parts.splice(0, 3);
  return '/' + parts.join().replace(/,/g, '/');
};