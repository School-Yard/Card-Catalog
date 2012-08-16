
module.exports = (function() {

  function dispatch_error(res, status, message) {
    status = status || 400;
    message = message || '';

    // lazy dispatcher
    error(res, status, message);
  }

  function error(res, status, message) {
    res.writeHead(status, {'content-type': 'text/plain'});
    res.end(message);
  }

  return {
    error: dispatch_error
  };

}).call();