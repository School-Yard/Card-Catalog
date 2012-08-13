
module.exports = (function() {

  function dispatch_error(res, err) {
    // lazy dispatcher
    error(res, err);
  }

  function error(res, err) {
    res.writeHead(err, {'content-type': 'text/plain'});
    res.end(err.toString());
  }

  return {
    error: dispatch_error
  };

}).call();