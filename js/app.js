(function(app) {
  'use strict';

  var dom = app.dom || require('./dom.js');
  var Body = app.Body || require('./components/body.js');
  var CircuitModule = app.CircuitModule || require('./models/circuit-module.js');

  app.body = new Body({ element: dom.body() });

  // export 'ModularModule'
  var global = dom.global();
  CircuitModule.ModularModule.export(global.app || (global.app = {}));
})(this.app || (this.app = {}));
