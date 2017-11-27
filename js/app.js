(function(app) {
  'use strict';

  var dom = app.dom || require('./dom.js');
  var Body = app.Body || require('./components/body.js');
  var CircuitModule = app.CircuitModule || require('./models/circuit-module.js');

  dom.export('modular', CircuitModule.modular);
  app.body = new Body({ element: dom.body() });
})(this.app || (this.app = {}));
