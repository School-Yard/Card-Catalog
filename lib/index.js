var card_catalog = exports;

// Expose raw `classes`
card_catalog.category        = require('./card_catalog/category');
card_catalog.cards           = require('./card_catalog/cards');

// Expose helper methods
card_catalog.categorize      = require('./card_catalog/core').categorize;
card_catalog.add_cards       = require('./card_catalog/core').add_cards;
card_catalog.card            = require('./card_catalog/core').card;