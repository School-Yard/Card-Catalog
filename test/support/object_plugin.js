module.exports = {
  'name': 'Example',
  'slug': 'example',

  'init': function() {
    this.initialized = true;
  },

  'router': {
    'get': {
      '/': 'index',
      '/route': function(req, res) {}
    }
  },

  'events': {
    'error': function(err) {}
  },

  'static': __dirname + '/public',

  'index': function(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ "message": "Hello world!" }));
  }
};