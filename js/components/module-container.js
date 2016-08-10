(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitElement = app.CircuitElement || require('../models/circuit-element.js');
  var ModulePort = app.ModulePort || require('./module-port.js');
  var Module = app.Module || require('./module.js');
  var ModuleWire = app.ModuleWire || require('./module-wire.js');
  var ModuleWireRelation = app.ModuleWireRelation || require('../relations/module-wire-relation.js');

  var Binding = function(props) {
    this.sourceModule = props.sourceModule;
    this.sourcePort = props.sourcePort;
    this.targetModule = props.targetModule;
    this.targetPort = props.targetPort;
  };

  Binding.prototype.bind = function() {
    var source = this.sourceModule.circuitElementMember(this.sourcePort.name());
    var target = this.targetModule.circuitElementMember(this.targetPort.name());
    CircuitElement.bind(source, target);
  };

  Binding.prototype.unbind = function() {
    var source = this.sourceModule.circuitElementMember(this.sourcePort.name());
    var target = this.targetModule.circuitElementMember(this.targetPort.name());
    CircuitElement.unbind(source, target);
  };

  var BindingList = helper.inherits(function() {
    BindingList.super_.call(this);
  }, helper.List);

  BindingList.prototype.equal = function(a, b) {
    return (a.sourceModule === b.sourceModule &&
            a.sourcePort === b.sourcePort &&
            b.targetModule === b.targetModule &&
            b.targetPort === b.targetPort);
  };

  var ModuleContainer = helper.inherits(function(props) {
    ModuleContainer.super_.call(this);

    this.modules = this.prop([]);
    this.bindingList = this.prop(new BindingList());
    this.element = this.prop(props.element);
    this.dragCount = this.prop(0);

    this.deleter = ModuleContainer.prototype.deleter.bind(this);
    this.fronter = ModuleContainer.prototype.fronter.bind(this);
    this.portToggler = ModuleContainer.prototype.portToggler.bind(this);
    this.dragStarter = ModuleContainer.prototype.dragStarter.bind(this);
    this.dragEnder = ModuleContainer.prototype.dragEnder.bind(this);
    this.dragPortPlugStarter = ModuleContainer.prototype.dragPortPlugStarter.bind(this);
    this.dragPortPlugMover = ModuleContainer.prototype.dragPortPlugMover.bind(this);
    this.dragPortPlugEnder = ModuleContainer.prototype.dragPortPlugEnder.bind(this);
  }, jCore.Component);

  ModuleContainer.prototype.retainerElement = function() {
    return dom.child(this.element(), 0);
  };

  ModuleContainer.prototype.wireContainerElement = function() {
    return dom.child(this.element(), 1);
  };

  ModuleContainer.prototype.contentElement = function() {
    return dom.child(this.element(), 2);
  };

  ModuleContainer.prototype.wireHandleContainerElement = function() {
    return dom.child(this.element(), 3);
  };

  ModuleContainer.prototype.lock = function(type, module, port, wire) {
    var relations = port.relations();

    var hasRelation = relations.some(function(relation) {
      return relation.consistsOf(type, module, port, wire);
    });

    if (hasRelation)
      return;

    var relation = new ModuleWireRelation({
      type: type,
      module: module,
      port: port,
      wire: wire
    });

    relations.push(relation);
    module.relations().push(relation);
  };

  ModuleContainer.prototype.unlock = function(type, module, port, wire) {
    var relations = port.relations();

    for (var i = relations.length - 1; i >= 0; i--) {
      var relation = relations[i];
      if (relation.consistsOf(type, module, port, wire)) {
        relations.splice(i, 1);
        var moduleRelations = module.relations();
        moduleRelations.splice(moduleRelations.indexOf(relation), 1);
        break;
      }
    }
  };

  ModuleContainer.prototype.bind = function(sourceModule, sourcePort, targetModule, targetPort) {
    var bindingList = this.bindingList();

    var binding = new Binding({
      sourceModule: sourceModule,
      sourcePort: sourcePort,
      targetModule: targetModule,
      targetPort: targetPort
    });

    if (bindingList.contains(binding))
      return;

    binding.bind();
    bindingList.add(binding);
  };

  ModuleContainer.prototype.unbind = function(sourceModule, sourcePort, targetModule, targetPort) {
    var bindingList = this.bindingList();

    var binding = new Binding({
      sourceModule: sourceModule,
      sourcePort: sourcePort,
      targetModule: targetModule,
      targetPort: targetPort
    });

    if (!bindingList.contains(binding))
      return;

    binding.unbind();
    bindingList.remove(binding);
  };

  ModuleContainer.prototype.redraw = function() {
    var x = 0;
    var y = 0;

    this.modules().forEach(function(module) {
      var diagonalPoint = module.diagonalPoint();
      x = Math.max(diagonalPoint.x, x);
      y = Math.max(diagonalPoint.y, y);
    });

    var padding = 80;
    var translate = 'translate(' + (x - 1 + padding) + 'px, ' + (y - 1 + padding) + 'px)';

    dom.css(this.retainerElement(), {
      transform: translate,
      webkitTransform: translate
    });

    dom.toggleClass(this.element(), 'module-dragging', this.dragCount() > 0);
  };

  ModuleContainer.prototype.loadModule = function(props) {
    var module = new Module(helper.extend({}, props, {
      deleter: this.deleter,
      fronter: this.fronter,
      portToggler: this.portToggler,
      dragStarter: this.dragStarter,
      dragEnder: this.dragEnder,
      dragPortPlugStarter: this.dragPortPlugStarter,
      dragPortPlugMover: this.dragPortPlugMover,
      dragPortPlugEnder: this.dragPortPlugEnder
    }));
    this.modules().push(module);
    this.updateZIndex();
    module.parentElement(this.contentElement());
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

  ModuleContainer.prototype.portToggler = function() {
    // resize the element
    this.markDirty();
  };

  ModuleContainer.prototype.dragStarter = function() {
    this.dragCount(this.dragCount() + 1);
  };

  ModuleContainer.prototype.dragEnder = function() {
    this.dragCount(this.dragCount() - 1);
  };

  ModuleContainer.prototype.dragPortPlugStarter = function(module, port, context) {
    var x = module.x() + ModulePort.PLUG_OFFSET_X;
    var y = module.y() + module.portListTop() + port.top() + port.height() / 2;
    var wire = new ModuleWire({
      sourceX: x,
      sourceY: y,
      targetX: x,
      targetY: y,
      handleType: port.type(),
      handleVisible: true,
      parentHandleElement: this.wireHandleContainerElement()
    });
    wire.parentElement(this.wireContainerElement());
    this.lock(ModuleContainer.LOCK_TYPE_PLUG, module, port, wire);
    context.x = x;
    context.y = y;
    context.wire = wire;
  };

  ModuleContainer.prototype.dragPortPlugMover = function(module, port, dx, dy, context) {
    var wire = context.wire;
    wire.targetX(context.x + dx);
    wire.targetY(context.y + dy);
  };

  ModuleContainer.prototype.dragPortPlugEnder = function(module, port, context) {
    var wire = context.wire;
    this.unlock(ModuleContainer.LOCK_TYPE_PLUG, module, port, wire);
    wire.parentElement(null);
  };

  ModuleContainer.LOCK_TYPE_PLUG = ModuleWireRelation.TYPE_SOURCE;
  ModuleContainer.LOCK_TYPE_SOCKET = ModuleWireRelation.TYPE_TARGET;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleContainer;
  else
    app.ModuleContainer = ModuleContainer;
})(this.app || (this.app = {}));
