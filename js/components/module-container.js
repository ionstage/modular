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
    this.dragCount = this.prop(0);

    this.deleter = ModuleContainer.prototype.deleter.bind(this);
    this.fronter = ModuleContainer.prototype.fronter.bind(this);
    this.dragStarter = ModuleContainer.prototype.dragStarter.bind(this);
    this.dragEnder = ModuleContainer.prototype.dragEnder.bind(this);
  }, jCore.Component);

  ModuleContainer.prototype.retainerElement = function() {
    return dom.child(this.element(), 0);
  };

  ModuleContainer.prototype.wireContainerElement = function() {
    return dom.child(this.element(), 1);
  };

  ModuleContainer.prototype.loadModule = function(props) {
    props.deleter = this.deleter;
    props.fronter = this.fronter;
    props.dragStarter = this.dragStarter;
    props.dragEnder = this.dragEnder;
    var module = new Module(props);
    this.modules().push(module);
    this.updateZIndex();
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

  ModuleContainer.prototype.updateZIndex = function() {
    this.modules().forEach(function(module, index) {
      module.zIndex(index);
    });
  };

  ModuleContainer.prototype.deleter = function(module) {
    var modules = this.modules();
    var index = modules.indexOf(module);

    if (index === -1)
      return;

    modules.splice(index, 1);
    this.updateZIndex();
  };

  ModuleContainer.prototype.fronter = function(module) {
    this.toFront(module);
    this.updateZIndex();
  };

  ModuleContainer.prototype.dragStarter = function() {
    var dragCount = this.dragCount();

    if (dragCount === 0)
      dom.addClass(this.element(), 'module-dragging');

    this.dragCount(dragCount + 1);
  };

  ModuleContainer.prototype.dragEnder = function() {
    var dragCount = this.dragCount();

    if (dragCount === 1)
      dom.removeClass(this.element(), 'module-dragging');

    this.dragCount(dragCount - 1);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleContainer;
  else
    app.ModuleContainer = ModuleContainer;
})(this.app || (this.app = {}));
