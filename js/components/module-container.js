(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Module = app.Module || require('./module.js');

  var ModuleContainer = helper.inherits(function(props) {
    ModuleContainer.super_.call(this);

    this.modules = this.prop([]);
    this.element = this.prop(props.element);

    this.deleter = ModuleContainer.prototype.deleter.bind(this);

    new dom.Draggable({
      element: this.element(),
      onstart: ModuleContainer.prototype.onstart.bind(this)
    });
  }, jCore.Component);

  ModuleContainer.prototype.loadModule = function(props) {
    props.deleter = this.deleter;
    var module = new Module(props);
    this.modules().push(module);
    module.parentElement(this.element());
    module.redraw();
    return module.loadComponent().then(function() {
      return module;
    });
  };

  ModuleContainer.prototype.toFront = function(module) {
    var modules = this.modules();
    var index = modules.indexOf(module);

    if (index === -1)
      return;

    modules.splice(index, 1);
    modules.push(module);
  };

  ModuleContainer.prototype.onstart = function(x, y, event) {
    var modules = this.modules();
    var target = dom.target(event);

    var module = modules.filter(function(module) {
      return dom.contains(module.element(), target);
    })[0];

    if (!module)
      return;

    // move the target module on top of others
    this.toFront(module);
    modules.forEach(function(module, index) {
      module.zIndex(index);
    });
  };

  ModuleContainer.prototype.deleter = function(module) {
    var modules = this.modules();
    var index = modules.indexOf(module);

    if (index === -1)
      return;

    modules.splice(index, 1);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleContainer;
  else
    app.ModuleContainer = ModuleContainer;
})(this.app || (this.app = {}));
