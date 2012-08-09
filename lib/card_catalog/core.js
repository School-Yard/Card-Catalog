var Category = require('./category'),
    Cards = require('./cards');

var card_catalog = exports;

/**
 * Helper function for Category
 *
 * @params
 * options {Object} - options to pass into Category instance
 *
 * A helper function for creating a catalog of
 * categories.
 *
 * returns an instance of Category
 */
card_catalog.categorize = function(options) {
  this.catalog = new Category(options);
  this.catalog.load();
  return this.catalog;
};

/**
 * Helper function for Cards
 *
 * @params
 * options {Object} - options to pass into Cards instance
 *
 * A helper function for creating a cache of card
 * modules that are available to categories.
 *
 * returns an instance of Cards
 */
card_catalog.add_cards = function(options) {
  var cards = new Cards(options);
  cards.load();
  this.catalog.cards = cards;
  return cards;
};

/**
 * Helper for requiring an empty card
 *
 * Plugins that use Card-Catalog should "inherit"
 * from this to get access to the route function.
 */
card_catalog.card = require('./card');