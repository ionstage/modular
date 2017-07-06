(function(app) {
  'use strict';

  var dom = app.dom || require('./dom.js');
  var Body = app.Body || require('./components/body.js');
  var CircuitElement = app.CircuitElement || require('./models/circuit-element.js');

  app.body = new Body({ element: dom.body() });

  // export 'ModularModule'
  var global = dom.global();
  CircuitElement.ModularModule.export(global.app || (global.app = {}));
})(this.app || (this.app = {}));
