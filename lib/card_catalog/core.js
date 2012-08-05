var Category = require('./category'),
    Cards = require('./cards');

var card_catalog = exports;

card_catalog.categorize = function(options) {
  this.catalog = new Category(options);
  this.catalog.load();
  return this.catalog;
};

card_catalog.add_cards = function(options) {
  var cards = new Cards(options);
  cards.load();
  this.catalog.cards = cards;
  return cards;
};

card_catalog.card = require('./empty_card');