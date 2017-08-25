(function(app) {
  'use strict';

  var dom = app.dom || require('./dom.js');
  var Body = app.Body || require('./components/body.js');
  var CircuitModule = app.CircuitModule || require('./models/circuit-module.js');

  dom.export('ModularModule', CircuitModule.ModularModule);
  app.body = new Body();
})(this.app || (this.app = {}));
