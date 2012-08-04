var Category = require('./category'),
    Cards = require('./cards');

var card_catalog = exports;

card_catalog.categorize = function(options) {
  this.catalog = new Category(options);
  this.catalog.load();
  return this.catalog;
};

card_catalog.add_cards = function(options) {
  this.catalog.cards = new Cards(options);
};

card_catalog.card = require('./empty_card');