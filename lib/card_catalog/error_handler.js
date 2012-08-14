
module.exports = (function() {

  function dispatch_error(res, err) {
    // lazy dispatcher
    error(res, err);
  }

  function error(res, err) {
    res.writeHead(err.status, {'content-type': 'text/plain'});
    res.end(err.status.toString());
  }

  return {
    error: dispatch_error
  };

}).call();