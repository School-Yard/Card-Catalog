module.exports = {
  'name': 'Example',
  'slug': 'example',

  'router': {
    'get': {
      '/': 'index',
      '/route': function(req, res) {}
    }
  },

  'events': {
    'error': function(err) {}
  },

  'index': function(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ "message": "Hello world!" }));
  }
};