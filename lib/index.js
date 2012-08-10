/**
 * Expose Card-Catalog API
 */
exports.Category = require('./card_catalog/category');
exports.CardCollection = require('./card_catalog/collection');
exports.Card = require('./card_catalog/card');


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
exports.Categorize = function(options) {
  var catalog = new Category(options);
  catalog.load();
  return catalog;
};