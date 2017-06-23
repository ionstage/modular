(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var BindingCollection = app.BindingCollection || require('../collections/binding-collection.js');
  var Component = app.Component || require('./component.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');
  var LockRelationCollection = app.LockRelationCollection || require('../collections/lock-relation-collection.js');
  var Module = app.Module || require('./module.js');
  var ModuleUnit = app.ModuleUnit || require('../models/module-unit.js');
  var ModuleWire = app.ModuleWire || require('./module-wire.js');

  var MainContent = Component.inherits(function(props) {
    this.modules = this.prop([]);
    this.draggingWires = this.prop([]);

    this.lockRelationCollection = new LockRelationCollection();
    this.bindingCollection = new BindingCollection();

    this.deleter = MainContent.prototype.deleter.bind(this);
    this.fronter = MainContent.prototype.fronter.bind(this);
    this.portToggler = MainContent.prototype.portToggler.bind(this);
    this.portEventer = MainContent.prototype.portEventer.bind(this);
    this.dragStarter = MainContent.prototype.dragStarter.bind(this);
    this.dragEnder = MainContent.prototype.dragEnder.bind(this);
    this.dragPortPlugStarter = MainContent.prototype.dragPortPlugStarter.bind(this);
    this.dragPortPlugMover = MainContent.prototype.dragPortPlugMover.bind(this);
    this.dragPortPlugEnder = MainContent.prototype.dragPortPlugEnder.bind(this);
    this.dragPortSocketStarter = MainContent.prototype.dragPortSocketStarter.bind(this);
    this.dragPortSocketMover = MainContent.prototype.dragPortSocketMover.bind(this);
    this.dragPortSocketEnder = MainContent.prototype.dragPortSocketEnder.bind(this);

    this.moduleDragStarter = props.moduleDragStarter;
    this.moduleDragEnder = props.moduleDragEnder;

    this.registerPointListener();
  });

  MainContent.prototype.retainerElement = function() {
    return dom.child(this.element(), 0);
  };

  MainContent.prototype.wireContainerElement = function() {
    return dom.child(this.element(), 1);
  };

  MainContent.prototype.containerElement = function() {
    return dom.child(this.element(), 2);
  };

  MainContent.prototype.wireHandleContainerElement = function() {
    return dom.child(this.element(), 3);
  };

  MainContent.prototype.clientPosition = function() {
    var rect = dom.rect(this.element());
    return new dom.Point({ x: rect.left, y: rect.top });
  };

  MainContent.prototype.scrollLeft = function() {
    return dom.scrollLeft(this.element());
  };

  MainContent.prototype.scrollTop = function() {
    return dom.scrollTop(this.element());
  };

  MainContent.prototype.localPoint = function(point) {
    var clientPosition = this.clientPosition();
    var bodyRect = dom.rect(dom.body());
    return new dom.Point({
      x: point.x - clientPosition.x + this.scrollLeft() + bodyRect.left,
      y: point.y - clientPosition.y + this.scrollTop() + bodyRect.top,
    });
  };

  MainContent.prototype.diagonalPoint = function() {
    var point = new dom.Point({ x: 0, y: 0 });
    this.modules().forEach(function(module) {
      var diagonalPoint = module.diagonalPoint();
      point.x = Math.max(diagonalPoint.x, point.x);
      point.y = Math.max(diagonalPoint.y, point.y);
    });
    return point;
  };

  MainContent.prototype.retainerPosition = function() {
    var diagonalPoint = this.diagonalPoint();
    return new dom.Point({
      x: diagonalPoint.x - 1 + MainContent.RETAINER_PADDING,
      y: diagonalPoint.y - 1 + MainContent.RETAINER_PADDING,
    });
  };

  MainContent.prototype.wireHandleContainerZIndex = function() {
    return this.modules().length + 1;
  };

  MainContent.prototype.lockedWires = function(type, unit) {
    return this.lockRelationCollection.filter({
      type: type,
      unit: unit,
    }).map(function(relation) {
      return relation.wire;
    });
  };

  MainContent.prototype.attachedWire = function(targetUnit) {
    return this.lockedWires(LockRelation.TYPE_SOCKET, targetUnit)[0];
  };

  MainContent.prototype.connectedTargetUnits = function(sourceUnit) {
    return this.bindingCollection.filter({
      sourceUnit: sourceUnit,
    }).map(function(binding) {
      return binding.targetUnit;
    });
  };

  MainContent.prototype.connectedSourceUnit = function(targetUnit) {
    // socket of the target port can only be connected to one wire
    var binding = this.bindingCollection.filter({
      targetUnit: targetUnit,
    })[0];
    return (binding ? binding.sourceUnit : null);
  };

  MainContent.prototype.unitFromSocketPosition = function(x, y) {
    var port = null;
    var module = helper.findLast(this.modules(), function(module) {
      // XXX: keep the last port for creating unit
      port = module.portFromSocketPosition(x, y);
      return !!port;
    });
    return (module ? new ModuleUnit({ module: module, port: port }) : null);
  };

  MainContent.prototype.toData = function() {
    return {
      modules: this.toModulesData(),
      connections: this.toConnectionsData(this.modules()),
    };
  };

  MainContent.prototype.toModulesData = function() {
    return this.modules().map(function(module) {
      return {
        props: module.props(),
        visiblePortNames: module.visiblePortNames(),
      };
    });
  };

  MainContent.prototype.toConnectionsData = function(modules) {
    return this.bindingCollection.map(function(binding) {
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

  MainContent.prototype.registerPointListener = function() {
    dom.on(this.element(), dom.eventType('start'), function(event) {
      // remove keyboard focus when pointing background
      if (dom.target(event) === this.element()) {
        dom.removeFocus();
      }
    }.bind(this));
  };

  MainContent.prototype.load = function(data) {
    return this.loadModules(data.modules).then(function(modules) {
      return this.loadConnections(data.connections, modules);
    }.bind(this));
  };

  MainContent.prototype.loadModules = function(modulesData) {
    return Promise.all(modulesData.map(function(moduleData) {
      return this.loadModule(moduleData.props, moduleData.visiblePortNames);
    }.bind(this)));
  };

  MainContent.prototype.loadConnections = function(connectionsData, modules) {
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

  MainContent.prototype.clear = function() {
    this.modules().slice().forEach(function(module) {
      module.delete();
    });
  };

  MainContent.prototype.createModule = function(props) {
    return new Module(helper.extend(helper.clone(props), {
      parentElement: this.containerElement(),
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

  MainContent.prototype.createConnectingWire = function(sourceUnit, targetUnit) {
    var sourcePosition = sourceUnit.portPlugPosition();
    var targetPosition = targetUnit.portSocketPosition();
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

  MainContent.prototype.createDraggingWire = function(sourceUnit) {
    var position = sourceUnit.portPlugPosition();
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

  MainContent.prototype.loadModule = function(props, visiblePortNames) {
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

  MainContent.prototype.loadModuleByClientPosition = function(props, visiblePortNames) {
    var localPoint = this.localPoint(helper.pick(props, ['x', 'y']));

    if (localPoint.x < 0 || localPoint.y < 0) {
      return Promise.reject(new RangeError('Invalid position'));
    }

    return this.loadModule(helper.extend(helper.clone(props), localPoint), visiblePortNames);
  };

  MainContent.prototype.lock = function(type, unit, wire) {
    this.lockRelationCollection.add({
      type: type,
      unit: unit,
      wire: wire,
    });
  };

  MainContent.prototype.unlock = function(type, unit, wire) {
    this.lockRelationCollection.remove({
      type: type,
      unit: unit,
      wire: wire,
    });
  };

  MainContent.prototype.bind = function(sourceUnit, targetUnit) {
    this.bindingCollection.add({
      sourceUnit: sourceUnit,
      targetUnit: targetUnit,
    });
  };

  MainContent.prototype.unbind = function(sourceUnit, targetUnit) {
    this.bindingCollection.remove({
      sourceUnit: sourceUnit,
      targetUnit: targetUnit,
    });
  };

  MainContent.prototype.canConnect = function(sourceUnit, targetUnit) {
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

  MainContent.prototype.connect = function(sourceUnit, targetUnit) {
    var wire = this.createConnectingWire(sourceUnit, targetUnit);
    wire.markDirty();
    targetUnit.portSocketConnected(true);
    this.bind(sourceUnit, targetUnit);
    this.lock(LockRelation.TYPE_PLUG, sourceUnit, wire);
    this.lock(LockRelation.TYPE_SOCKET, targetUnit, wire);
    this.updateEventHighlight(sourceUnit);
  };

  MainContent.prototype.disconnect = function(sourceUnit, targetUnit) {
    var wire = this.attachedWire(targetUnit);
    wire.parentElement(null);
    targetUnit.portSocketConnected(false);
    this.unbind(sourceUnit, targetUnit);
    this.unlock(LockRelation.TYPE_PLUG, sourceUnit, wire);
    this.unlock(LockRelation.TYPE_SOCKET, targetUnit, wire);
    targetUnit.portSocketHighlighted(false);
  };

  MainContent.prototype.disconnectAll = function(unit) {
    this.bindingCollection.forEach(function(binding) {
      if (helper.equal(binding.sourceUnit, unit) || helper.equal(binding.targetUnit, unit)) {
        this.disconnect(binding.sourceUnit, binding.targetUnit);
      }
    }.bind(this));
  };

  MainContent.prototype.appendDraggingWire = function(sourceUnit, wire) {
    this.lock(LockRelation.TYPE_PLUG, sourceUnit, wire);
    this.updateEventHighlight(sourceUnit);
    this.draggingWires().push(wire);
    this.updateDragHighlight(sourceUnit);
  };

  MainContent.prototype.attachDraggingWire = function(sourceUnit, targetUnit, wire) {
    wire.handleVisible(false);
    targetUnit.portSocketConnected(true);
    this.bind(sourceUnit, targetUnit);
    this.lock(LockRelation.TYPE_SOCKET, targetUnit, wire);
    this.updateEventHighlight(sourceUnit);
    this.updateDragHighlight(targetUnit);
  };

  MainContent.prototype.detachDraggingWire = function(sourceUnit, targetUnit, wire) {
    wire.handleVisible(true);
    targetUnit.portSocketConnected(false);
    this.unbind(sourceUnit, targetUnit);
    this.unlock(LockRelation.TYPE_SOCKET, targetUnit, wire);
    targetUnit.portSocketHighlighted(false);
    this.updateDragHighlight(targetUnit);
  };

  MainContent.prototype.removeDraggingWire = function(sourceUnit, targetUnit, wire) {
    helper.remove(this.draggingWires(), wire);
    this.updateDragHighlight(sourceUnit);

    // keep the element of wire if the target unit is connected with the wire
    if (targetUnit) {
      this.updateDragHighlight(targetUnit);
    } else {
      this.unlock(LockRelation.TYPE_PLUG, sourceUnit, wire);
      wire.parentElement(null);
    }
  };

  MainContent.prototype.updateRetainer = function() {
    this.markDirty();
  };

  MainContent.prototype.updateWireHandleContainer = function() {
    this.markDirty();
  };

  MainContent.prototype.updateZIndex = function() {
    this.modules().forEach(function(module, index) {
      module.zIndex(index);
    });
  };

  MainContent.prototype.updateEventHighlight = function(sourceUnit) {
    var highlighted = sourceUnit.portPlugHighlighted();
    this.connectedTargetUnits(sourceUnit).forEach(function(targetUnit) {
      targetUnit.portSocketHighlighted(highlighted);
    });
    this.lockedWires(LockRelation.TYPE_PLUG, sourceUnit).forEach(function(wire) {
      wire.highlighted(highlighted);
    });
  };

  MainContent.prototype.updateDragHighlight = function(unit) {
    var draggingWires = this.draggingWires();
    var highlighted = this.lockRelationCollection.filter({
      unit: unit,
    }).some(function(relation) {
      return (draggingWires.indexOf(relation.wire) !== -1);
    });
    unit.portHighlighted(highlighted);
  };

  MainContent.prototype.redraw = function() {
    this.redrawRetainer();
    this.redrawWireHandleContainer();
  };

  MainContent.prototype.redrawRetainer = function() {
    this.redrawProp('retainerPosition', function(retainerPosition) {
      dom.translate(this.retainerElement(), retainerPosition.x, retainerPosition.y);
    });
  };

  MainContent.prototype.redrawWireHandleContainer = function() {
    this.redrawProp('wireHandleContainerZIndex', function(wireHandleContainerZIndex) {
      dom.css(this.wireHandleContainerElement(), { zIndex: wireHandleContainerZIndex });
    });
  };

  MainContent.prototype.deleter = function(module) {
    var modules = this.modules();

    if (modules.indexOf(module) === -1) {
      return;
    }

    helper.remove(modules, module);
    this.updateZIndex();
    this.updateWireHandleContainer();
  };

  MainContent.prototype.fronter = function(module) {
    helper.moveToBack(this.modules(), module);
    this.updateZIndex();
  };

  MainContent.prototype.portToggler = function(unit) {
    if (!unit.portVisible()) {
      this.disconnectAll(unit);
    }

    this.updateRetainer();
  };

  MainContent.prototype.portEventer = function(sourceUnit) {
    sourceUnit.portPlugHighlighted(true);
    this.updateEventHighlight(sourceUnit);

    setTimeout(function() {
      sourceUnit.portPlugHighlighted(false);
      this.updateEventHighlight(sourceUnit);
    }.bind(this), 100);
  };

  MainContent.prototype.dragStarter = function() {
    this.updateRetainer();
    this.moduleDragStarter();
  };

  MainContent.prototype.dragEnder = function() {
    this.updateRetainer();
    this.moduleDragEnder();
  };

  MainContent.prototype.dragPortPlugStarter = function(sourceUnit, context) {
    var wire = this.createDraggingWire(sourceUnit);
    wire.markDirty();
    this.appendDraggingWire(sourceUnit, wire);

    var position = sourceUnit.portPlugPosition();
    context.x = position.x;
    context.y = position.y;
    context.wire = wire;
    context.targetUnit = null;
  };

  MainContent.prototype.dragPortPlugMover = function(sourceUnit, dx, dy, context) {
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

  MainContent.prototype.dragPortPlugEnder = function(sourceUnit, context) {
    this.removeDraggingWire(sourceUnit, context.targetUnit, context.wire);
  };

  MainContent.prototype.dragPortSocketStarter = function(targetUnit, context) {
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

  MainContent.prototype.dragPortSocketMover = function(targetUnit, dx, dy, context) {
    this.dragPortPlugMover(context.sourceUnit, dx, dy, context);
  };

  MainContent.prototype.dragPortSocketEnder = function(targetUnit, context) {
    this.dragPortPlugEnder(context.sourceUnit, context);
  };

  MainContent.RETAINER_PADDING = 80;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainContent;
  } else {
    app.MainContent = MainContent;
  }
})(this.app || (this.app = {}));
