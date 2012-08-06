var utils = exports;

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