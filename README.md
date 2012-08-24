Card Catalog
==============

A dynamic and RESTful routing system for Node JS that allows you to attach and detach routes on the fly. It was designed to be used in a CMS-like environment where sites are built upon dynamic routers.

[![Build Status](https://secure.travis-ci.org/School-Yard/Card-Catalog.png?branch=master)](http://travis-ci.org/School-Yard/Card-Catalog)

**Status**: Experimental

## Overview

Card-Catalog is an opinionated framework for building a routing table. It doesn't assume anything about the server architecture and should work with Express, Flatiron, or a simple request handler.

The framework is built on the idea of a routing table being based on a collection of 1:M relationships. It uses the concepts of Categories and Cards where a top-level URI path would represent a Category and further URI paths are represented by Cards.

It can be represented using a simple RESTful example:

`http://example.com/[Category]/[Card]/[Controller]/[Model]/[Action]`

A Category will be made up of various plugin-style classes which we call Cards. Each Card will inherit from a base Card Catalog - [Card](https://github.com/School-Yard/Card-Catalog/blob/master/lib/card_catalog/card.js).

A request will flow through the catalog by first attempting to match a category slug to the request URI path. If matched it will dispatch the request to a collection of cards where it will attempt to match the rest of the URI path to a card slug. Finally, if both matches are found it will call the `route` method on the Card class.

**Category**: A top level URI path, contains an array of card objects.

**Collection**: A collection of available Card plugins.

**Card**: A individual module that contains logic for handling a request.

## Install

```bash
$ npm install cardcatalog
```

## Usage

Card-Catalog requires at least one data connection to lookup stored category definitions when the server is started. It currently only has support for [TrapperKeeper](https://github.com/School-Yard/TrapperKeeper) but it should be trivial to change this.

Card-Catalog allows for the use of Connect style middleware with a `(req, res, next)` style signature or an evented middleware like that in use on Flatiron where a `next` event is triggered on the `res` object.

A catalog instance's `dispatch` method will be used where you would otherwise use a route handler function. In a Connect/Express or Flatiron environment you will want the catalog to be the last middleware function in the stack.

*Below is an example of how to use card catalog as a route dispatcher in a simple Node.js http server.*

### Example:

```js
var trapper_keeper = require('trapperkeeper'),
    card_catalog = require('cardcatalog'),
    http = require('http'),
    DB;

// Create a data-connection, using memory for example purposes
DB = trapper_keeper.connect('memory');

// On `ready`
DB.on('ready', function() {

  // Create a new Card Catalog
  var catalog = new card_catalog.Category({
    connection: DB, // required, data connection
    namespace: 'categories', // required, a namespace to find available categories
    adapters: [ ] // optional, array of data connections available to cards
  });

  // Load the Catalog with data from data connection
  catalog.load();

  // Add Cards (Discussed Later)
  catalog.addCards({
    example_card_1,
    example_card_2
  });

  // Optional, Middleware (Accepts Connect/Express style and Flatiron style)
  catalog.before = [
    connect.bodyParser(),
    connect.methodOverride()
  ];

  // Create an HTTP server and dispatch to catalog
  http.createServer(function(req, res) {
    catalog.dispatch(req, res);
  }).listen(3000);
});
```

## Constructor

When creating a new Card Catalog you call the constructor method of `Category` which accepts the following arguments:

**connection:** *required*, A TrapperKeeper connection used to lookup stored categories.

**namespace:** *optional, defaults to `cardCatalog`*, sets the table, collection, or namespace to look up categories in. Dependent on which TrapperKeeper engine you are using.

**cards:** *optional*, Allows you to pass in a Card Collection Object when instantiating a Category.

**error_handler:** *optional*, A function to catch any error events in the request life-cycle.

**adapters:** *optional*, An object of named data connections that get passed to each card. This allows a card access to a data connection without having to know about it's properties. It also prevents cards from opening their own data connections.

```js
var card_catalog = require('cardcatalog');

var catalog = new card_catalog.Category({
  connection: conn,
  namespace: 'namespace',
  cards: new card_category.CardCollection({}),
  error_handler: function(res, status, message) {},
  adapters: { 'memory': mem_conn, 'mongo': mongo_conn }
});
```

## Categories

A Category represents a top level URI path. It will be used to form the base route structure on a Card-Catalog route table. Every route, including the root path, must be wrapped in a category.

Categories are read from a data store when the catalog is instantiated and added to an internal cache object to build the initial route table.

After the initial cache is built you can attach/detach categories dynamically by calling the `.attach()` and `.detach()` methods on a catalog. This works by manipulating a published flag on the category, which is required of each category.

#### Example Category Object

*A base category structure for a URI representing `http://example.com/foo` would look like:*

```js
var category = {
  id : 1,
  name : "Foo",    // required, Unique key value
  slug : "foo",    // required, URL encoded permalink
  plugins : [ ],   // default to empty
  published : true // required, True or False
};
```

#### Example Attach/Detach

*An example of how you would add/remove routes from a live app*

```js
var catalog = new card_catalog.Category({
  connection: DB,
  namespace: 'categories'
});

// Fictional event emitter
events.on('attach', function(category) {
  catalog.attach(category);
});

events.on('detach', function(category) {
  catalog.detach(category);
});
```

## Collection

A collection is a group of Card classes that are available for routing. It is built when the `addCards` method is called on a Category instance.

An internal cache is built that includes all the card objects arranged using the Card's slug as a key.

A collection functions very similar to a Category. When a request is matched on a Category the Collection's `dispatch` method is called. The method will attempt to match a Card's slug to the URI path. If a match is found it will call the `route` method of a Card.

A circular reference is added to instantiated Card in the collection under card.collection.

#### Example

```js
var catalog = new card_catalog.Category({
  connection: conn,
  namespace: namespace
});

// Load the categories from a data-store
catalog.load();

// Add Card Objects to the catalog
catalog.addCards({
  cards: [
    Card_1,
    Card_2
  ]
});
```

## Cards

A card is simply a function that inherits from the [Card](https://github.com/School-Yard/Card-Catalog/blob/master/lib/card_catalog/card.js) class. It should contain the logic for handling all child routes.

It can be created using a function that inherits from the [Card Class](https://github.com/School-Yard/Card-Catalog/blob/master/lib/card_catalog/card.js) using `util.inherits` or as an Object. Examples of both are shown below.

#### Required Options


**name:** Must be unique. *Example: `My Awesome Plugin`*

**slug:** Must be unique and url-encoded. *Example: `my-awesome-plugin`*

**router:** An object that maps routes to functions based on URI path and req.method.
```js
// Create an example routing table
this.router = {
  'get': {
    '/': index,
    '/new': form,
    '/:id': show,
    '/:id/edit': edit
  },
  'put': {
    '/:id': update
  },
  'post': {
    '/': create
  },
  'delete': {
    '/:id': destroy
  }
};
```

#### Other Options

**engine:** A template rendering engine to use. Must be an array in the form ['file extension', render_function]

Uses the `__express` method of a template rendering engine so either use a rendering engine that works out of the box with Express or use [Consolidate](https://github.com/visionmedia/consolidate.js).

```js
// Example using dust
this.engine = ['dust', consolidate.dust];
```

**templates:** An absolute path on the file system to a template directory. With the engine property and the templates property each Card can have it's own view system.

```js
// Template path
this.templates = __dirname + '/templates';
```

**set_static:** Allows a static directory to be set so any assets specific to a card will be served. Uses [node-static](https://github.com/cloudhead/node-static) behind the scenes so any valid options for node-static are accepted.

```js
this.set_static(__dirname + '/public, options);
```

### Examples

*Cards may be defined as either Functions or Objects. Examples of both are given:*

#### Object

```js
var consolidate = require('consolidate');

module.exports = {
  'name': 'Example',
  'slug': 'example',

  'engine': ['dot', consolidate.dot],
  'templates': __dirname + '/templates',

  // Objects allow an 'init' function that is called in a cards
  // constructor after the settings have been set.
  'init': function() {
    this.category = new CategoryModel({
      adapters: this.adapters
    });
  },

  'router': {
    'get': {
      '/': index,
      '/new': form,
      '/:id': show,
      '/:id/edit': edit
    },
    'put': {
      '/:id': update
    },
    'post': {
      '/': create
    },
    'delete': {
      '/:id': destroy
    }
  },

  // Add Event Listeners
  // Same as:
  // this.on('error', function(err) {});
  'events': {
    'error': function(err) {}
  },

  // Add a static directory for Card assets
  'static': __dirname + '/public'
};
```

#### Function

```js
var card_catalog = require('cardcatalog'),
    util = require('util'),
    consolidate = require('consolidate');

var Example = module.exports = function Example(options) {
  card_catalog.Card.call(this, options);

  this.name = "Example"; // Required
  this.slug = "example"; // Required

  // Set view rendering options
  this.engine = ['dust', consolidate.dust];
  this.templates = __dirname + '/templates';

  // Create a model instance passing in global data connections
  this.User = new User({
    adapters: this.adapters
  });

  this.set_static = __dirname + '/public';

  // Create the Example routing table
  this.router = {
    'get': {
      '/': index,
      '/new': form,
      '/:id': show,
      '/:id/edit': edit
    },
    'put': {
      '/:id': update
    },
    'post': {
      '/': create
    },
    'delete': {
      '/:id': destroy
    }
  };
};

util.inherits(Example, card_catalog.Card);

// Function get passed in the req and res objects
function index (req, res) {}

// If a named parameter is set the params object is set
function show (req, res, params) {
  var id = params.id;
}
```

## Tests

All tests are written in [mocha](https://github.com/visionmedia/mocha) and should be run with npm.

```bash
$ npm test
```