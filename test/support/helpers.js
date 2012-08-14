var trapper_keeper = require('trapperkeeper'),
    Category = require('../../lib/card_catalog/category'),
    Collection = require('../../lib/card_catalog/collection'),
    card = require('./example_plugin');
    events = require('events');

var helpers = module.exports;

/**
 * Setup a generic catalog using the memory
 * adapter and generic error_handler.
 */
helpers.setup_catalog = function(callback) {
  var store = trapper_keeper.connect('memory');

  store.connection.on('ready', function() {

    var category = new Category({
      connection: store,
      namespace: 'test',
      error_handler: function(res, err) {
        return true;
      }
    });

    callback(category);
  });
};

/**
 * Create a mock stream object
 */
helpers.mock_stream = function() {
  return new events.EventEmitter();
};

/**
 * Create/Save a test category object
 */
helpers.create_catalog_object = function(catalog, callback) {
  var test_category = {name: 'example', slug: 'foobar', plugins: ['Example']};
  
  catalog.on('loaded', function() {
    callback();
  });

  catalog.storage.create(test_category, function() {
    catalog.load();
  });
};

/**
 *
 */
helpers.load_cards = function(catalog) {
  
  catalog.cards = new Collection({
    cards: [card],
    error_handler: function(res, err) {
      return true;
    }
  });

  catalog.cards.load();
};