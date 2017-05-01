(function(app) {
  'use strict';

  var dom = app.dom || require('./dom.js');
  var Body = app.Body || require('./components/body.js');

  app.body = new Body({ element: dom.body() });

  // for modular-module
  var global = dom.global();
  if (!global.app) {
    global.app = {};
  }
})(this.app || (this.app = {}));
