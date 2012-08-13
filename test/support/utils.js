var trapper_keeper = require('trapperkeeper'),
    card_catalog = require('../../lib'),
    card = require('./example_plugin');
    events = require('events');

var utils = module.exports;

/**
 * Setup a generic catalog using the memory
 * adapter and generic error_handler.
 */
utils.setup_catalog = function(callback) {
  var store = trapper_keeper.connect('memory');

  store.connection.on('ready', function() {

    var category = new card_catalog.Category({
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
utils.mock_stream = function() {
  return new events.EventEmitter();
};

/**
 * Create/Save a test category object
 */
utils.create_catalog_object = function(catalog, callback) {
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
utils.load_cards = function(catalog) {
  
  catalog.cards = new card_catalog.CardCollection({
    cards: [card],
    error_handler: function(res, err) {
      return true;
    }
  });

  catalog.cards.load();
};