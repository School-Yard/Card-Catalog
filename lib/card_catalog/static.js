var path = require('path'),
    url = require('url'),
    utils = require('./utils'),
    staticServer = require('node-static');

/**
 * Constructor
 *
 * @params
 * root {String} - a path to serve files from
 * options {Object} - options for node-static
 *
 * Creates a static file server using node-static.
 */
var Server = module.exports = function(root, options) {
  this.root = root || '.';
  this.options = options || {};
  this._server = new staticServer.Server(this.root, options);
};

/**
 * Serve Function
 *
 * @params
 * req {http.ServerRequest}  - the http request object
 * res {http.ServerResponse} - the http response object
 * callback {Function} - a callback function
 *
 * Attempts to serve a file or directory using node-static's
 * serve method.
 */
Server.prototype.serve = function serve(req, res, callback) {
  this._server.serve(req, res, function (err, result) {
    if(err) return callback(err);
  });
};


/**
 * Override the node-static resolve method
 *
 * Removes the category slug and card slug from a url.pathname
 * in order for node-static to find it and serve the correct file.
 */
staticServer.Server.prototype.resolve = function (pathname) {
  var filepath = utils.cleanPathname(pathname);
  return path.resolve(path.join(this.root, filepath));
};