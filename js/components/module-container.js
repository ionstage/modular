(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var Module = app.Module || require('./module.js');

  var ModuleContainer = helper.inherits(function(props) {
    ModuleContainer.super_.call(this);

    this.modules = this.prop([]);
    this.element = this.prop(props.element);
  }, jCore.Component);

  ModuleContainer.prototype.loadModule = function(props) {
    var module = new Module(props);
    this.modules().push(module);
    module.parentElement(this.element());
    module.redraw();
    return module.loadComponent();
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleContainer;
  else
    app.ModuleContainer = ModuleContainer;
})(this.app || (this.app = {}));
