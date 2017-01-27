(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitElement = app.CircuitElement || require('../models/circuit-element.js');
  var Component = app.Component || require('./component.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');
  var Module = app.Module || require('./module.js');
  var ModuleUnit = app.ModuleUnit || require('../models/module-unit.js');
  var ModuleWire = app.ModuleWire || require('./module-wire.js');

  var LockRelationCollection = function() {
    this.data = new helper.Map();
  };

  LockRelationCollection.prototype.add = function(props) {
    var data = this.data;
    var relation = new LockRelation(props);

    if (data.has(relation)) {
      return;
    }

    props.unit.addRelation(relation);
    data.set(relation, relation);
  };

  LockRelationCollection.prototype.remove = function(props) {
    var data = this.data;
    var relation = data.get(new LockRelation(props));

    if (!relation) {
      return;
    }

    props.unit.removeRelation(relation);
    data.delete(relation);
  };

  LockRelationCollection.prototype.filter = function(props) {
    var relations = [];
    this.data.forEach(function(relation) {
      var matched = Object.keys(props).every(function(key) {
        return helper.equal(relation[key](), props[key]);
      });
      if (matched) {
        relations.push(relation);
      }
    });
    return relations;
  };

  var Binding = function(props) {
    this.sourceUnit = props.sourceUnit;
    this.targetUnit = props.targetUnit;
  };

  Binding.prototype.equal = function(other) {
    if (!other) {
      return false;
    }
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

    if (data.has(binding)) {
      return;
    }

    binding.bind();
    data.add(binding);
  };

  BindingCollection.prototype.remove = function(props) {
    var data = this.data;
    var binding = new Binding(props);

    if (!data.has(binding)) {
      return;
    }

    binding.unbind();
    data.delete(binding);
  };

  var ModuleContainer = helper.inherits(function(props) {
    ModuleContainer.super_.call(this, props);

    this.modules = this.prop([]);
    this.lockRelationCollection = this.prop(new LockRelationCollection());
    this.bindingCollection = this.prop(new BindingCollection());
    this.disabled = this.prop(false);
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

    this.moduleDragStarter = props.moduleDragStarter;
    this.moduleDragEnder = props.moduleDragEnder;
  }, Component);

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

  ModuleContainer.prototype.clientPosition = function() {
    var rect = dom.rect(this.element());
    return { x: rect.left, y: rect.top };
  };

  ModuleContainer.prototype.scrollLeft = function() {
    return dom.scrollLeft(this.element());
  };

  ModuleContainer.prototype.scrollTop = function() {
    return dom.scrollTop(this.element());
  };

  ModuleContainer.prototype.diagonalPoint = function() {
    var point = { x: 0, y: 0 };
    this.modules().forEach(function(module) {
      var diagonalPoint = module.diagonalPoint();
      point.x = Math.max(diagonalPoint.x, point.x);
      point.y = Math.max(diagonalPoint.y, point.y);
    });
    return point;
  };

  ModuleContainer.prototype.lockedWires = function(type, unit) {
    return this.lockRelationCollection().filter({
      type: type,
      unit: unit,
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

  ModuleContainer.prototype.unitFromSocketPosition = function(x, y) {
    var modules = this.modules();
    for (var mi = modules.length - 1; mi >= 0; mi--) {
      var module = modules[mi];
      var ports = module.ports();
      for (var pi = ports.length - 1; pi >= 0; pi--) {
        var port = ports[pi];
        var position = module.socketPosition(port);
        if (Math.abs(x - position.x) > 18) {
          break;
        }
        if (Math.abs(y - position.y) > 18) {
          continue;
        }
        if (!port.visible() || port.socketDisabled()) {
          continue;
        }
        return new ModuleUnit({ module: module, port: port });
      }
    }
    return null;
  };

  ModuleContainer.prototype.toData = function() {
    return {
      modules: this.toModulesData(),
      connections: this.toConnectionsData(this.modules()),
    };
  };

  ModuleContainer.prototype.toModulesData = function() {
    return this.modules().map(function(module) {
      return {
        props: module.props(),
        visiblePortNames: module.visiblePortNames(),
      };
    });
  };

  ModuleContainer.prototype.toConnectionsData = function(modules) {
    return this.bindings().map(function(binding) {
      var sourceUnit = binding.sourceUnit;
      var targetUnit = binding.targetUnit;
      var sourceModuleIndex = helper.findIndex(modules, function(module) {
        return sourceUnit.contains(module);
      });
      var targetModuleIndex = helper.findIndex(modules, function(module) {
        return targetUnit.contains(module);
      });
      return {
        source: { moduleIndex: sourceModuleIndex, portName: sourceUnit.portName() },
        target: { moduleIndex: targetModuleIndex, portName: targetUnit.portName() },
      };
    });
  };

  ModuleContainer.prototype.load = function(data) {
    return this.loadModules(data.modules).then(function(modules) {
      return this.loadConnections(data.connections, modules);
    }.bind(this));
  };

  ModuleContainer.prototype.loadModules = function(modulesData) {
    return Promise.all(modulesData.map(function(moduleData) {
      return this.loadModule(moduleData.props, moduleData.visiblePortNames);
    }.bind(this)));
  };

  ModuleContainer.prototype.loadConnections = function(connectionsData, modules) {
    return Promise.all(connectionsData.map(function(connectionData) {
      var source = connectionData.source;
      var target = connectionData.target;
      var unitMap = {
        source: ModuleUnit.fromModuleAndPortName(modules[source.moduleIndex], source.portName),
        target: ModuleUnit.fromModuleAndPortName(modules[target.moduleIndex], target.portName),
      };
      if (!this.canConnect(unitMap.source, unitMap.target)) {
        throw new Error('Invalid connection');
      }
      return unitMap;
    }.bind(this))).then(function(unitMaps) {
      unitMaps.forEach(function(unitMap) {
        this.connect(unitMap.source, unitMap.target);
      }.bind(this));
    }.bind(this));
  };

  ModuleContainer.prototype.clear = function() {
    this.modules().slice().forEach(function(module) {
      module.delete();
    });
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
      dragPortSocketEnder: this.dragPortSocketEnder,
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
      parentHandleElement: this.wireHandleContainerElement(),
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
      parentHandleElement: this.wireHandleContainerElement(),
    });
  };

  ModuleContainer.prototype.loadModule = function(props, visiblePortNames) {
    var module = this.createModule(props);
    this.modules().push(module);
    this.updateZIndex();
    this.updateWireHandleContainer();
    module.redraw();
    return module.loadComponent().then(function() {
      visiblePortNames.forEach(function(name) {
        module.showPort(name);
      });
      return module;
    });
  };

  ModuleContainer.prototype.loadModuleByClientPosition = function(props, visiblePortNames) {
    var clientPosition = this.clientPosition();
    var x = props.x - clientPosition.x + this.scrollLeft();
    var y = props.y - clientPosition.y + this.scrollTop();

    if (x < 0 || y < 0) {
      return Promise.reject(new Error('Invalid position'));
    }

    return this.loadModule(helper.extend(helper.clone(props), {
      x: x,
      y: y,
    }), visiblePortNames);
  };

  ModuleContainer.prototype.lock = function(type, unit, wire) {
    this.lockRelationCollection().add({
      type: type,
      unit: unit,
      wire: wire,
    });
  };

  ModuleContainer.prototype.unlock = function(type, unit, wire) {
    this.lockRelationCollection().remove({
      type: type,
      unit: unit,
      wire: wire,
    });
  };

  ModuleContainer.prototype.bind = function(sourceUnit, targetUnit) {
    this.bindingCollection().add({
      sourceUnit: sourceUnit,
      targetUnit: targetUnit,
    });
  };

  ModuleContainer.prototype.unbind = function(sourceUnit, targetUnit) {
    this.bindingCollection().remove({
      sourceUnit: sourceUnit,
      targetUnit: targetUnit,
    });
  };

  ModuleContainer.prototype.canConnect = function(sourceUnit, targetUnit) {
    if (!sourceUnit || !targetUnit) {
      return false;
    }

    if (sourceUnit.portType() !== targetUnit.portType()) {
      return false;
    }

    if (sourceUnit.portPlugDisabled() || targetUnit.portSocketDisabled()) {
      return false;
    }

    if (!sourceUnit.portVisible() || !targetUnit.portVisible()) {
      return false;
    }

    if (targetUnit.portSocketConnected()) {
      return false;
    }

    return true;
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
      if (helper.equal(binding.sourceUnit, unit) || helper.equal(binding.targetUnit, unit)) {
        this.disconnect(binding.sourceUnit, binding.targetUnit);
      }
    }.bind(this));
  };

  ModuleContainer.prototype.appendDraggingWire = function(sourceUnit, wire) {
    this.lock(ModuleContainer.LOCK_TYPE_PLUG, sourceUnit, wire);
    this.updateEventHighlight(sourceUnit);
    this.draggingWires().push(wire);
    this.updateDragHighlight(sourceUnit);
  };

  ModuleContainer.prototype.attachDraggingWire = function(sourceUnit, targetUnit, wire) {
    wire.handleVisible(false);
    targetUnit.portSocketConnected(true);
    this.bind(sourceUnit, targetUnit);
    this.lock(ModuleContainer.LOCK_TYPE_SOCKET, targetUnit, wire);
    this.updateEventHighlight(sourceUnit);
    this.updateDragHighlight(targetUnit);
  };

  ModuleContainer.prototype.detachDraggingWire = function(sourceUnit, targetUnit, wire) {
    wire.handleVisible(true);
    targetUnit.portSocketConnected(false);
    this.unbind(sourceUnit, targetUnit);
    this.unlock(ModuleContainer.LOCK_TYPE_SOCKET, targetUnit, wire);
    targetUnit.portSocketHighlighted(false);
    this.updateDragHighlight(targetUnit);
  };

  ModuleContainer.prototype.removeDraggingWire = function(sourceUnit, targetUnit, wire) {
    helper.remove(this.draggingWires(), wire);
    this.updateDragHighlight(sourceUnit);

    // keep the element of wire if the target unit is connected with the wire
    if (targetUnit) {
      this.updateDragHighlight(targetUnit);
    } else {
      this.unlock(ModuleContainer.LOCK_TYPE_PLUG, sourceUnit, wire);
      wire.parentElement(null);
    }
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
      unit: unit,
    }).some(function(relation) {
      return (draggingWires.indexOf(relation.wire()) !== -1);
    });
    unit.labelHighlighted(highlighted);
  };

  ModuleContainer.prototype.redraw = function() {
    this.redrawState('disabled', 'disabled');
    this.redrawRetainer();
    this.redrawWireHandleContainer();
  };

  ModuleContainer.prototype.redrawRetainer = function() {
    var point = this.diagonalPoint();
    var padding = 80;
    var retainerX = point.x - 1 + padding;
    var retainerY = point.y - 1 + padding;
    var cache = this.cache();

    if (retainerX === cache.retainerX && retainerY === cache.retainerY) {
      return;
    }

    dom.translate(this.retainerElement(), retainerX, retainerY);
    cache.retainerX = retainerX;
    cache.retainerY = retainerY;
  };

  ModuleContainer.prototype.redrawWireHandleContainer = function() {
    var zIndex = this.modules().length + 1;
    var cache = this.cache();

    if (zIndex === cache.zIndex) {
      return;
    }

    dom.css(this.wireHandleContainerElement(), { zIndex: zIndex });
    cache.zIndex = zIndex;
  };

  ModuleContainer.prototype.deleter = function(module) {
    var modules = this.modules();

    if (modules.indexOf(module) === -1) {
      return;
    }

    helper.remove(modules, module);
    this.updateZIndex();
    this.updateWireHandleContainer();
  };

  ModuleContainer.prototype.fronter = function(module) {
    helper.moveToBack(this.modules(), module);
    this.updateZIndex();
  };

  ModuleContainer.prototype.portToggler = function(unit) {
    if (!unit.portVisible()) {
      this.disconnectAll(unit);
    }

    this.updateRetainer();
  };

  ModuleContainer.prototype.portEventer = function(sourceUnit) {
    sourceUnit.portPlugHighlighted(true);
    this.updateEventHighlight(sourceUnit);

    setTimeout(function() {
      sourceUnit.portPlugHighlighted(false);
      this.updateEventHighlight(sourceUnit);
    }.bind(this), 100);
  };

  ModuleContainer.prototype.dragStarter = function() {
    this.updateRetainer();
    this.moduleDragStarter();
  };

  ModuleContainer.prototype.dragEnder = function() {
    this.updateRetainer();
    this.moduleDragEnder();
  };

  ModuleContainer.prototype.dragPortPlugStarter = function(sourceUnit, context) {
    var wire = this.createDraggingWire(sourceUnit);
    wire.markDirty();
    this.appendDraggingWire(sourceUnit, wire);

    var position = sourceUnit.plugPosition();
    context.x = position.x;
    context.y = position.y;
    context.wire = wire;
    context.targetUnit = null;
  };

  ModuleContainer.prototype.dragPortPlugMover = function(sourceUnit, dx, dy, context) {
    var x = context.x + dx;
    var y = context.y + dy;
    var currentTargetUnit = context.targetUnit;
    var unit = this.unitFromSocketPosition(x, y);

    if (unit && helper.equal(unit, currentTargetUnit)) {
      // fix the target position of the wire
      return;
    }

    var wire = context.wire;
    wire.targetX(x);
    wire.targetY(y);

    if (currentTargetUnit) {
      this.detachDraggingWire(sourceUnit, currentTargetUnit, wire);
    }

    var targetUnit = (this.canConnect(sourceUnit, unit) ? unit : null);
    if (targetUnit) {
      this.attachDraggingWire(sourceUnit, targetUnit, wire);
    }

    context.targetUnit = targetUnit;
  };

  ModuleContainer.prototype.dragPortPlugEnder = function(sourceUnit, context) {
    this.removeDraggingWire(sourceUnit, context.targetUnit, context.wire);
  };

  ModuleContainer.prototype.dragPortSocketStarter = function(targetUnit, context) {
    var wire = this.attachedWire(targetUnit);
    var sourceUnit = this.connectedSourceUnit(targetUnit);

    this.draggingWires().push(wire);
    this.updateDragHighlight(sourceUnit);
    this.updateDragHighlight(targetUnit);

    context.x = wire.targetX();
    context.y = wire.targetY();
    context.wire = wire;
    context.sourceUnit = sourceUnit;
    context.targetUnit = targetUnit;
  };

  ModuleContainer.prototype.dragPortSocketMover = function(targetUnit, dx, dy, context) {
    this.dragPortPlugMover(context.sourceUnit, dx, dy, context);
  };

  ModuleContainer.prototype.dragPortSocketEnder = function(targetUnit, context) {
    this.dragPortPlugEnder(context.sourceUnit, context);
  };

  ModuleContainer.LOCK_TYPE_PLUG = LockRelation.TYPE_PLUG;
  ModuleContainer.LOCK_TYPE_SOCKET = LockRelation.TYPE_SOCKET;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleContainer;
  } else {
    app.ModuleContainer = ModuleContainer;
  }
})(this.app || (this.app = {}));
