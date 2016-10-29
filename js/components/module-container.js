(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitElement = app.CircuitElement || require('../models/circuit-element.js');
  var ModuleUnit = app.ModuleUnit || require('../models/module-unit.js');
  var Module = app.Module || require('./module.js');
  var ModuleWire = app.ModuleWire || require('./module-wire.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');

  var LockRelationCollection = function() {
    this.data = new helper.Map();
  };

  LockRelationCollection.prototype.add = function(props) {
    var data = this.data;
    var relation = new LockRelation(props);

    if (data.has(relation))
      return;

    props.unit.addRelation(relation);
    data.set(relation, relation);
  };

  LockRelationCollection.prototype.remove = function(props) {
    var data = this.data;
    var relation = data.get(new LockRelation(props));

    if (!relation)
      return;

    props.unit.removeRelation(relation);
    data.delete(relation);
  };

  LockRelationCollection.prototype.filter = function(props) {
    var relations = [];
    this.data.forEach(function(relation) {
      var matched = Object.keys(props).map(function(key) {
        return helper.equal(relation[key](), props[key]);
      }).every(helper.identity);
      if (matched)
        relations.push(relation);
    });
    return relations;
  };

  var Binding = function(props) {
    this.sourceUnit = props.sourceUnit;
    this.targetUnit = props.targetUnit;
  };

  Binding.prototype.equal = function(other) {
    return Object.keys(this).every(function(key) {
      return helper.equal(this[key], other[key]);
    }.bind(this));
  };

  Binding.prototype.source = function() {
    return this.sourceUnit.circuitElementMember();
  };

  Binding.prototype.target = function() {
    return this.targetUnit.circuitElementMember();
  };

  Binding.prototype.bind = function() {
    CircuitElement.bind(this.source(), this.target());
  };

  Binding.prototype.unbind = function() {
    CircuitElement.unbind(this.source(), this.target());
  };

  var BindingCollection = function() {
    this.data = new helper.Set();
  };

  BindingCollection.prototype.toArray = function() {
    return this.data.toArray();
  };

  BindingCollection.prototype.add = function(props) {
    var data = this.data;
    var binding = new Binding(props);

    if (data.has(binding))
      return;

    binding.bind();
    data.add(binding);
  };

  BindingCollection.prototype.remove = function(props) {
    var data = this.data;
    var binding = new Binding(props);

    if (!data.has(binding))
      return;

    binding.unbind();
    data.delete(binding);
  };

  var ModuleContainer = helper.inherits(function(props) {
    ModuleContainer.super_.call(this);

    this.modules = this.prop([]);
    this.lockRelationCollection = this.prop(new LockRelationCollection());
    this.bindingCollection = this.prop(new BindingCollection());
    this.element = this.prop(props.element);
    this.dragCount = this.prop(0);
    this.draggingWires = this.prop([]);

    this.deleter = ModuleContainer.prototype.deleter.bind(this);
    this.fronter = ModuleContainer.prototype.fronter.bind(this);
    this.portToggler = ModuleContainer.prototype.portToggler.bind(this);
    this.portEventer = ModuleContainer.prototype.portEventer.bind(this);
    this.dragStarter = ModuleContainer.prototype.dragStarter.bind(this);
    this.dragEnder = ModuleContainer.prototype.dragEnder.bind(this);
    this.dragPortPlugStarter = ModuleContainer.prototype.dragPortPlugStarter.bind(this);
    this.dragPortPlugMover = ModuleContainer.prototype.dragPortPlugMover.bind(this);
    this.dragPortPlugEnder = ModuleContainer.prototype.dragPortPlugEnder.bind(this);
    this.dragPortSocketStarter = ModuleContainer.prototype.dragPortSocketStarter.bind(this);
    this.dragPortSocketMover = ModuleContainer.prototype.dragPortSocketMover.bind(this);
    this.dragPortSocketEnder = ModuleContainer.prototype.dragPortSocketEnder.bind(this);
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

  ModuleContainer.prototype.lockedWires = function(type, unit) {
    return this.lockRelationCollection().filter({
      type: type,
      unit: unit
    }).map(function(relation) {
      return relation.wire();
    });
  };

  ModuleContainer.prototype.attachedWire = function(targetUnit) {
    return this.lockedWires(ModuleContainer.LOCK_TYPE_SOCKET, targetUnit)[0];
  };

  ModuleContainer.prototype.bindings = function() {
    return this.bindingCollection().toArray();
  };

  ModuleContainer.prototype.connectedTargetUnits = function(sourceUnit) {
    return this.bindings().filter(function(binding) {
      return helper.equal(binding.sourceUnit, sourceUnit);
    }).map(function(binding) {
      return binding.targetUnit;
    });
  };

  ModuleContainer.prototype.connectedSourceUnit = function(targetUnit) {
    // socket of the target port can only be connected to one wire
    return this.bindings().filter(function(binding) {
      return helper.equal(binding.targetUnit, targetUnit);
    }).map(function(binding) {
      return binding.sourceUnit;
    })[0] || null;
  };

  ModuleContainer.prototype.createModule = function(props) {
    return new Module(helper.extend(helper.clone(props), {
      parentElement: this.contentElement(),
      deleter: this.deleter,
      fronter: this.fronter,
      portToggler: this.portToggler,
      portEventer: this.portEventer,
      dragStarter: this.dragStarter,
      dragEnder: this.dragEnder,
      dragPortPlugStarter: this.dragPortPlugStarter,
      dragPortPlugMover: this.dragPortPlugMover,
      dragPortPlugEnder: this.dragPortPlugEnder,
      dragPortSocketStarter: this.dragPortSocketStarter,
      dragPortSocketMover: this.dragPortSocketMover,
      dragPortSocketEnder: this.dragPortSocketEnder
    }));
  };

  ModuleContainer.prototype.createConnectingWire = function(sourceUnit, targetUnit) {
    var sourcePosition = sourceUnit.plugPosition();
    var targetPosition = targetUnit.socketPosition();
    return new ModuleWire({
      sourceX: sourcePosition.x,
      sourceY: sourcePosition.y,
      targetX: targetPosition.x,
      targetY: targetPosition.y,
      handleType: sourceUnit.portType(),
      handleVisible: false,
      parentElement: this.wireContainerElement(),
      parentHandleElement: this.wireHandleContainerElement()
    });
  };

  ModuleContainer.prototype.createDraggingWire = function(sourceUnit) {
    var position = sourceUnit.plugPosition();
    return new ModuleWire({
      sourceX: position.x,
      sourceY: position.y,
      targetX: position.x,
      targetY: position.y,
      handleType: sourceUnit.portType(),
      handleVisible: true,
      parentElement: this.wireContainerElement(),
      parentHandleElement: this.wireHandleContainerElement()
    });
  };

  ModuleContainer.prototype.lock = function(type, unit, wire) {
    this.lockRelationCollection().add({
      type: type,
      unit: unit,
      wire: wire
    });
  };

  ModuleContainer.prototype.unlock = function(type, unit, wire) {
    this.lockRelationCollection().remove({
      type: type,
      unit: unit,
      wire: wire
    });
  };

  ModuleContainer.prototype.bind = function(sourceUnit, targetUnit) {
    this.bindingCollection().add({
      sourceUnit: sourceUnit,
      targetUnit: targetUnit
    });
  };

  ModuleContainer.prototype.unbind = function(sourceUnit, targetUnit) {
    this.bindingCollection().remove({
      sourceUnit: sourceUnit,
      targetUnit: targetUnit
    });
  };

  ModuleContainer.prototype.connect = function(sourceUnit, targetUnit) {
    var wire = this.createConnectingWire(sourceUnit, targetUnit);
    wire.markDirty();
    targetUnit.portSocketConnected(true);
    this.bind(sourceUnit, targetUnit);
    this.lock(ModuleContainer.LOCK_TYPE_PLUG, sourceUnit, wire);
    this.lock(ModuleContainer.LOCK_TYPE_SOCKET, targetUnit, wire);
    this.updateEventHighlight(sourceUnit);
  };

  ModuleContainer.prototype.disconnect = function(sourceUnit, targetUnit) {
    var wire = this.attachedWire(targetUnit);
    wire.parentElement(null);
    targetUnit.portSocketConnected(false);
    this.unbind(sourceUnit, targetUnit);
    this.unlock(ModuleContainer.LOCK_TYPE_PLUG, sourceUnit, wire);
    this.unlock(ModuleContainer.LOCK_TYPE_SOCKET, targetUnit, wire);
    targetUnit.portSocketHighlighted(false);
  };

  ModuleContainer.prototype.disconnectAll = function(unit) {
    this.bindings().forEach(function(binding) {
      if (helper.equal(binding.sourceUnit, unit) || helper.equal(binding.targetUnit, unit))
        this.disconnect(binding.sourceUnit, binding.targetUnit);
    }.bind(this));
  };

  ModuleContainer.prototype.redraw = function() {
    var modules = this.modules();
    var x = 0;
    var y = 0;

    modules.forEach(function(module) {
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

    dom.css(this.wireHandleContainerElement(), {
      zIndex: modules.length + 1
    });
  };

  ModuleContainer.prototype.loadModule = function(props) {
    var module = this.createModule(props);
    this.modules().push(module);
    this.updateZIndex();
    this.updateWireHandleContainer();
    module.redraw();
    return module.loadComponent().then(function() {
      return module;
    });
  };

  ModuleContainer.prototype.updateRetainer = function() {
    this.markDirty();
  };

  ModuleContainer.prototype.updateWireHandleContainer = function() {
    this.markDirty();
  };

  ModuleContainer.prototype.updateZIndex = function() {
    this.modules().forEach(function(module, index) {
      module.zIndex(index);
    });
  };

  ModuleContainer.prototype.updateEventHighlight = function(sourceUnit) {
    var highlighted = sourceUnit.portPlugHighlighted();
    this.connectedTargetUnits(sourceUnit).forEach(function(targetUnit) {
      targetUnit.portSocketHighlighted(highlighted);
    });
    this.lockedWires(ModuleContainer.LOCK_TYPE_PLUG, sourceUnit).forEach(function(wire) {
      wire.highlighted(highlighted);
    });
  };

  ModuleContainer.prototype.updateDragHighlight = function(unit) {
    var draggingWires = this.draggingWires();
    var highlighted = this.lockRelationCollection().filter({
      unit: unit
    }).some(function(relation) {
      return (draggingWires.indexOf(relation.wire()) !== -1);
    });
    unit.labelHighlighted(highlighted);
  };

  ModuleContainer.prototype.deleter = function(module) {
    var modules = this.modules();

    if (modules.indexOf(module) === -1)
      return;

    helper.remove(modules, module);
    this.updateZIndex();
    this.updateWireHandleContainer();
  };

  ModuleContainer.prototype.fronter = function(module) {
    helper.moveToBack(this.modules(), module);
    this.updateZIndex();
  };

  ModuleContainer.prototype.portToggler = function(module, port) {
    if (!port.visible())
      this.disconnectAll(new ModuleUnit({ module: module, port: port }));

    this.updateRetainer();
  };

  ModuleContainer.prototype.portEventer = function(module, port) {
    var sourceUnit = new ModuleUnit({ module: module, port: port });

    sourceUnit.portPlugHighlighted(true);
    this.updateEventHighlight(sourceUnit);

    setTimeout(function() {
      sourceUnit.portPlugHighlighted(false);
      this.updateEventHighlight(sourceUnit);
    }.bind(this), 100);
  };

  ModuleContainer.prototype.dragStarter = function() {
    this.dragCount(this.dragCount() + 1);
  };

  ModuleContainer.prototype.dragEnder = function() {
    this.dragCount(this.dragCount() - 1);
  };

  ModuleContainer.prototype.dragPortPlugStarter = function(sourceModule, sourcePort, context) {
    var sourceUnit = new ModuleUnit({ module: sourceModule, port: sourcePort });
    var wire = this.createDraggingWire(sourceUnit);
    wire.markDirty();
    this.lock(ModuleContainer.LOCK_TYPE_PLUG, sourceUnit, wire);
    this.updateEventHighlight(sourceUnit);
    this.draggingWires().push(wire);
    this.updateDragHighlight(sourceUnit);
    var position = sourceUnit.plugPosition();
    context.x = position.x;
    context.y = position.y;
    context.wire = wire;
    context.type = sourceUnit.portType();
    context.targetModule = null;
    context.targetPort = null;
  };

  ModuleContainer.prototype.dragPortPlugMover = function(sourceModule, sourcePort, dx, dy, context) {
    var wire = context.wire;
    var x = context.x + dx;
    var y = context.y + dy;

    wire.targetX(x);
    wire.targetY(y);

    var modules = this.modules();
    var type = context.type;
    var currentTargetModule = context.targetModule;
    var currentTargetPort = context.targetPort;
    var targetModule = null;
    var targetPort = null;

    // search the target port-socket by the position of the dragging wire-handle
    for (var mi = modules.length - 1; mi >= 0; mi--) {
      var module = modules[mi];
      var ports = module.ports();
      for (var pi = ports.length - 1; pi >= 0; pi--) {
        var port = ports[pi];
        var position = module.socketPosition(port);
        if (Math.abs(x - position.x) > 18)
          break;
        if (Math.abs(y - position.y) > 18)
          continue;
        if (!port.visible() || port.socketDisabled())
          continue;
        if (!port.socketConnected() && type === port.type()) {
          targetModule = module;
          targetPort = port;
        } else if (module === currentTargetModule && port === currentTargetPort) {
          targetModule = currentTargetModule;
          targetPort = currentTargetPort;
        }
        break;
      }
      if (targetModule && targetPort)
        break;
    }

    if (targetModule === currentTargetModule && targetPort === currentTargetPort) {
      if (targetPort) {
        // fix the target position of the wire
        targetPort.markDirty();
      }
      return;
    }

    if (currentTargetModule && currentTargetPort) {
      var sourceUnit = new ModuleUnit({ module: sourceModule, port: sourcePort });
      var currentTargetUnit = new ModuleUnit({ module: currentTargetModule, port: currentTargetPort });
      this.unbind(sourceUnit, currentTargetUnit);
      // detach the wire-handle from the current target port-socket
      this.unlock(ModuleContainer.LOCK_TYPE_SOCKET, currentTargetUnit, wire);
      wire.handleVisible(true);
      currentTargetUnit.portSocketConnected(false);
      currentTargetPort.socketHighlighted(false);
      this.updateDragHighlight(currentTargetUnit);
    }

    if (targetModule && targetPort) {
      var sourceUnit = new ModuleUnit({ module: sourceModule, port: sourcePort });
      var targetUnit = new ModuleUnit({ module: targetModule, port: targetPort });
      this.bind(sourceUnit, targetUnit);
      // attach the wire-handle to the target port-socket
      this.lock(ModuleContainer.LOCK_TYPE_SOCKET, targetUnit, wire);
      targetUnit.portSocketConnected(true);
      wire.handleVisible(false);
      this.updateEventHighlight(sourceUnit);
      this.updateDragHighlight(targetUnit);
    }

    context.targetModule = targetModule;
    context.targetPort = targetPort;
  };

  ModuleContainer.prototype.dragPortPlugEnder = function(sourceModule, sourcePort, context) {
    var wire = context.wire;
    var targetModule = context.targetModule;
    var targetPort = context.targetPort;

    var sourceUnit = new ModuleUnit({ module: sourceModule, port: sourcePort });

    helper.remove(this.draggingWires(), wire);
    this.updateDragHighlight(sourceUnit);

    if (targetModule && targetPort) {
      this.updateDragHighlight(new ModuleUnit({ module: targetModule, port: targetPort }));
      return;
    }

    // remove the dragging wire
    this.unlock(ModuleContainer.LOCK_TYPE_PLUG, sourceUnit, wire);
    wire.parentElement(null);
  };

  ModuleContainer.prototype.dragPortSocketStarter = function(targetModule, targetPort, context) {
    var targetUnit = new ModuleUnit({ module: targetModule, port: targetPort });
    var wire = this.attachedWire(targetUnit);

    this.draggingWires().push(wire);

    context.x = wire.targetX();
    context.y = wire.targetY();
    context.wire = wire;
    context.type = targetPort.type();

    var sourceUnit = this.connectedSourceUnit(targetUnit);
    var sourceModule = sourceUnit.module;
    var sourcePort = sourceUnit.port;

    this.updateDragHighlight(sourceUnit);
    this.updateDragHighlight(targetUnit);

    context.sourceModule = sourceModule;
    context.sourcePort = sourcePort;
    context.targetModule = targetModule;
    context.targetPort = targetPort;
  };

  ModuleContainer.prototype.dragPortSocketMover = function(targetModule, targetPort, dx, dy, context) {
    this.dragPortPlugMover(context.sourceModule, context.sourcePort, dx, dy, context);
  };

  ModuleContainer.prototype.dragPortSocketEnder = function(targetModule, targetPort, context) {
    this.dragPortPlugEnder(context.sourceModule, context.sourcePort, context);
  };

  ModuleContainer.LOCK_TYPE_PLUG = LockRelation.TYPE_PLUG;
  ModuleContainer.LOCK_TYPE_SOCKET = LockRelation.TYPE_SOCKET;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleContainer;
  else
    app.ModuleContainer = ModuleContainer;
})(this.app || (this.app = {}));
