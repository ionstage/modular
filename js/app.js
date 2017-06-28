(function(app) {
  'use strict';

  var dom = app.dom || require('./dom.js');
  var Body = app.Body || require('./components/body.js');
  var CircuitElement = app.CircuitElement || require('./models/circuit-element.js');

  app.body = new Body({ element: dom.body() });

  // export 'ModularModule'
  var global = dom.global();
  if (!global.app) {
    global.app = {};
  }
  Object.defineProperty(global.app, 'ModularModule', {
    value: function(members) {
      return new CircuitElement(members);
    },
  });
})(this.app || (this.app = {}));
