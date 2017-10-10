(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Binding = app.Binding || require('../models/binding.js');
  var Component = app.Component || require('./component.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');
  var Module = app.Module || require('./module.js');
  var ModuleWire = app.ModuleWire || require('./module-wire.js');
  var Unit = app.Unit || require('../models/unit.js');

  var MainContent = Component.inherits(function(props) {
    this.modules = [];
    this.draggingWires = [];
    this.lockRelations = [];
    this.bindings = [];

    this.dragStarter = MainContent.prototype.dragStarter.bind(this);
    this.dragEnder = MainContent.prototype.dragEnder.bind(this);
    this.dragPortPlugStarter = MainContent.prototype.dragPortPlugStarter.bind(this);
    this.dragPortPlugMover = MainContent.prototype.dragPortPlugMover.bind(this);
    this.dragPortPlugEnder = MainContent.prototype.dragPortPlugEnder.bind(this);
    this.dragPortSocketStarter = MainContent.prototype.dragPortSocketStarter.bind(this);
    this.dragPortSocketMover = MainContent.prototype.dragPortSocketMover.bind(this);
    this.dragPortSocketEnder = MainContent.prototype.dragPortSocketEnder.bind(this);
  });

  MainContent.prototype.retainerElement = function() {
    return this.childElement('.main-content-retainer');
  };

  MainContent.prototype.wireContainerElement = function() {
    return this.childElement('.module-wire-container');
  };

  MainContent.prototype.containerElement = function() {
    return this.childElement('.module-container');
  };

  MainContent.prototype.wireHandleContainerElement = function() {
    return this.childElement('.module-wire-handle-container');
  };

  MainContent.prototype.clientPosition = function() {
    var rect = dom.rect(this.element());
    return { x: rect.left, y: rect.top };
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
    return {
      x: point.x - clientPosition.x + this.scrollLeft() + bodyRect.left,
      y: point.y - clientPosition.y + this.scrollTop() + bodyRect.top,
    };
  };

  MainContent.prototype.diagonalPoint = function() {
    var point = { x: 0, y: 0 };
    this.modules.forEach(function(module) {
      var diagonalPoint = module.diagonalPoint();
      point.x = Math.max(diagonalPoint.x, point.x);
      point.y = Math.max(diagonalPoint.y, point.y);
    });
    return point;
  };

  MainContent.prototype.retainerPosition = function() {
    var diagonalPoint = this.diagonalPoint();
    return {
      x: diagonalPoint.x - 1 + MainContent.RETAINER_PADDING,
      y: diagonalPoint.y - 1 + MainContent.RETAINER_PADDING,
    };
  };

  MainContent.prototype.wireHandleContainerZIndex = function() {
    return this.modules.length + 1;
  };

  MainContent.prototype.moduleFromPort = function(port) {
    return helper.find(this.modules, function(module) {
      return (module.ports().indexOf(port) !== -1);
    });
  };

  MainContent.prototype.lockedWires = function(type, port) {
    return this.lockRelations.filter(function(relation) {
      return (relation.type === type && relation.port === port);
    }).map(function(relation) {
      return relation.wire;
    });
  };

  MainContent.prototype.attachedWire = function(targetPort) {
    return this.lockedWires(LockRelation.TYPE_SOCKET, targetPort)[0];
  };

  MainContent.prototype.connectedTargetPorts = function(sourcePort) {
    var sourceUnit = new Unit({ module: this.moduleFromPort(sourcePort), port: sourcePort });
    return this.bindings.filter(function(binding) {
      return helper.equal(binding.sourceUnit, sourceUnit);
    }).map(function(binding) {
      return binding.targetUnit.port;
    });
  };

  MainContent.prototype.connectedSourcePort = function(targetPort) {
    var targetUnit = new Unit({ module: this.moduleFromPort(targetPort), port: targetPort });

    // socket of the target port can only be connected to one wire
    var binding = this.bindings.filter(function(binding) {
      return helper.equal(binding.targetUnit, targetUnit);
    })[0];
    return (binding ? binding.sourceUnit.port : null);
  };

  MainContent.prototype.unitFromModuleAndPortName = function(module, portName) {
    var port = (module ? module.port(portName) : null);
    return (port ? new Unit({ module: module, port: port }) : null);
  };

  MainContent.prototype.unitFromSocketPosition = function(x, y) {
    var port = null;
    var module = helper.findLast(this.modules, function(module) {
      // XXX: keep the last port for creating unit
      port = module.portFromSocketPosition(x, y);
      return !!port;
    });
    return (module ? new Unit({ module: module, port: port }) : null);
  };

  MainContent.prototype.toData = function() {
    return {
      modules: this.toModulesData(),
      connections: this.toConnectionsData(this.modules),
    };
  };

  MainContent.prototype.toModulesData = function() {
    return this.modules.map(function(module) {
      return {
        props: module.props(),
        visiblePortNames: module.visiblePortNames(),
      };
    });
  };

  MainContent.prototype.toConnectionsData = function(modules) {
    return this.bindings.map(function(binding) {
      var sourceUnit = binding.sourceUnit;
      var targetUnit = binding.targetUnit;
      var sourceModuleIndex = helper.findIndex(modules, function(module) {
        return sourceUnit.contains(module);
      });
      var targetModuleIndex = helper.findIndex(modules, function(module) {
        return targetUnit.contains(module);
      });
      return {
        source: { moduleIndex: sourceModuleIndex, portName: sourceUnit.name() },
        target: { moduleIndex: targetModuleIndex, portName: targetUnit.name() },
      };
    });
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
        source: this.unitFromModuleAndPortName(modules[source.moduleIndex], source.portName),
        target: this.unitFromModuleAndPortName(modules[target.moduleIndex], target.portName),
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
    this.modules.slice().forEach(function(module) {
      module.delete();
    });
  };

  MainContent.prototype.createModule = function(props) {
    var module = new Module(helper.extend(helper.clone(props), {
      parentElement: this.containerElement(),
      dragStarter: this.dragStarter,
      dragEnder: this.dragEnder,
      dragPortPlugStarter: this.dragPortPlugStarter,
      dragPortPlugMover: this.dragPortPlugMover,
      dragPortPlugEnder: this.dragPortPlugEnder,
      dragPortSocketStarter: this.dragPortSocketStarter,
      dragPortSocketMover: this.dragPortSocketMover,
      dragPortSocketEnder: this.dragPortSocketEnder,
    }));
    module.on('delete', this.ondelete.bind(this));
    module.on('point', this.onpoint.bind(this));
    module.on('porttoggle', this.onporttoggle.bind(this));
    module.on('portevent', this.onportevent.bind(this));
    return module;
  };

  MainContent.prototype.createConnectingWire = function(sourcePort, targetPort) {
    return new ModuleWire({
      sourceX: sourcePort.plugX(),
      sourceY: sourcePort.plugY(),
      targetX: targetPort.socketX(),
      targetY: targetPort.socketY(),
      handleType: sourcePort.type(),
      handleVisible: false,
      parentElement: this.wireContainerElement(),
      parentHandleElement: this.wireHandleContainerElement(),
    });
  };

  MainContent.prototype.createDraggingWire = function(sourcePort) {
    return new ModuleWire({
      sourceX: sourcePort.plugX(),
      sourceY: sourcePort.plugY(),
      targetX: sourcePort.plugX(),
      targetY: sourcePort.plugY(),
      handleType: sourcePort.type(),
      handleVisible: true,
      parentElement: this.wireContainerElement(),
      parentHandleElement: this.wireHandleContainerElement(),
    });
  };

  MainContent.prototype.loadModule = function(props, visiblePortNames) {
    var module = this.createModule(props);
    this.modules.push(module);
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

  MainContent.prototype.lock = function(type, port, wire) {
    var relation = new LockRelation({
      type: type,
      port: port,
      wire: wire,
    });
    port.addRelation(relation);
    this.lockRelations.push(relation);
  };

  MainContent.prototype.unlock = function(type, port, wire) {
    var relation = helper.findLast(this.lockRelations, function(relation) {
      return (relation.type === type && relation.port === port && relation.wire === wire);
    });
    port.removeRelation(relation);
    helper.remove(this.lockRelations, relation);
  };

  MainContent.prototype.bind = function(sourceUnit, targetUnit) {
    var binding = new Binding({
      sourceUnit: sourceUnit,
      targetUnit: targetUnit,
    });
    binding.bind();
    this.bindings.push(binding);
  };

  MainContent.prototype.unbind = function(sourceUnit, targetUnit) {
    var binding = helper.findLast(this.bindings, function(binding) {
      return helper.equal(binding.sourceUnit, sourceUnit) && helper.equal(binding.targetUnit, targetUnit);
    });
    binding.unbind();
    helper.remove(this.bindings, binding);
  };

  MainContent.prototype.canConnect = function(sourceUnit, targetUnit) {
    if (!sourceUnit || !targetUnit) {
      return false;
    }
    if (sourceUnit.port.type() !== targetUnit.port.type()) {
      return false;
    }
    if (sourceUnit.port.plugDisabled() || targetUnit.port.socketDisabled()) {
      return false;
    }
    if (!sourceUnit.port.visible() || !targetUnit.port.visible()) {
      return false;
    }
    if (targetUnit.port.socketConnected()) {
      return false;
    }
    return true;
  };

  MainContent.prototype.connect = function(sourceUnit, targetUnit) {
    var wire = this.createConnectingWire(sourceUnit.port, targetUnit.port);
    wire.markDirty();
    targetUnit.socketConnected(true);
    this.bind(sourceUnit, targetUnit);
    this.lock(LockRelation.TYPE_PLUG, sourceUnit.port, wire);
    this.lock(LockRelation.TYPE_SOCKET, targetUnit.port, wire);
    this.updateEventHighlight(sourceUnit);
  };

  MainContent.prototype.disconnect = function(sourceUnit, targetUnit) {
    var wire = this.attachedWire(targetUnit.port);
    wire.parentElement(null);
    targetUnit.socketConnected(false);
    this.unbind(sourceUnit, targetUnit);
    this.unlock(LockRelation.TYPE_PLUG, sourceUnit.port, wire);
    this.unlock(LockRelation.TYPE_SOCKET, targetUnit.port, wire);
    targetUnit.socketHighlighted(false);
  };

  MainContent.prototype.disconnectAll = function(unit) {
    this.bindings.slice().forEach(function(binding) {
      if (helper.equal(binding.sourceUnit, unit) || helper.equal(binding.targetUnit, unit)) {
        this.disconnect(binding.sourceUnit, binding.targetUnit);
      }
    }.bind(this));
  };

  MainContent.prototype.appendDraggingWire = function(sourceUnit, wire) {
    this.lock(LockRelation.TYPE_PLUG, sourceUnit.port, wire);
    this.updateEventHighlight(sourceUnit);
    this.draggingWires.push(wire);
    this.updateDragHighlight(sourceUnit.port);
  };

  MainContent.prototype.attachDraggingWire = function(sourceUnit, targetUnit, wire) {
    wire.handleVisible(false);
    targetUnit.socketConnected(true);
    this.bind(sourceUnit, targetUnit);
    this.lock(LockRelation.TYPE_SOCKET, targetUnit.port, wire);
    this.updateEventHighlight(sourceUnit);
    this.updateDragHighlight(targetUnit.port);
  };

  MainContent.prototype.detachDraggingWire = function(sourceUnit, targetUnit, wire) {
    wire.handleVisible(true);
    targetUnit.socketConnected(false);
    this.unbind(sourceUnit, targetUnit);
    this.unlock(LockRelation.TYPE_SOCKET, targetUnit.port, wire);
    targetUnit.socketHighlighted(false);
    this.updateDragHighlight(targetUnit.port);
  };

  MainContent.prototype.removeDraggingWire = function(sourceUnit, targetUnit, wire) {
    helper.remove(this.draggingWires, wire);
    this.updateDragHighlight(sourceUnit.port);

    // keep the element of wire if the target unit is connected with the wire
    if (targetUnit) {
      this.updateDragHighlight(targetUnit.port);
    } else {
      this.unlock(LockRelation.TYPE_PLUG, sourceUnit.port, wire);
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
    this.modules.forEach(function(module, index) {
      module.zIndex(index);
    });
  };

  MainContent.prototype.updateEventHighlight = function(sourceUnit) {
    var highlighted = sourceUnit.plugHighlighted();
    this.connectedTargetPorts(sourceUnit.port).forEach(function(targetPort) {
      targetPort.socketHighlighted(highlighted);
    });
    this.lockedWires(LockRelation.TYPE_PLUG, sourceUnit.port).forEach(function(wire) {
      wire.highlighted(highlighted);
    });
  };

  MainContent.prototype.updateDragHighlight = function(port) {
    var highlighted = this.lockRelations.filter(function(relation) {
      return (relation.port === port);
    }).some(function(relation) {
      return (this.draggingWires.indexOf(relation.wire) !== -1);
    }.bind(this));
    port.highlighted(highlighted);

    // module is deletable if all ports are NOT highlighted
    var module = this.moduleFromPort(port);
    module.deletable(!module.hasHighlightedPort());
  };

  MainContent.prototype.redrawRetainer = function() {
    this.redrawBy('retainerPosition', function(retainerPosition) {
      dom.translate(this.retainerElement(), retainerPosition.x, retainerPosition.y);
    });
  };

  MainContent.prototype.redrawWireHandleContainer = function() {
    this.redrawBy('wireHandleContainerZIndex', function(wireHandleContainerZIndex) {
      dom.css(this.wireHandleContainerElement(), { zIndex: wireHandleContainerZIndex });
    });
  };

  MainContent.prototype.oninit = function() {
    dom.on(this.element(), dom.eventType('start'), function(event) {
      // remove keyboard focus when pointing background
      if (dom.target(event) === this.element()) {
        dom.removeFocus();
      }
    }.bind(this));
  };

  MainContent.prototype.onredraw = function() {
    this.redrawRetainer();
    this.redrawWireHandleContainer();
  };

  MainContent.prototype.ondelete = function(module) {
    helper.remove(this.modules, module);
    this.updateZIndex();
    this.updateWireHandleContainer();
  };

  MainContent.prototype.onpoint = function(module) {
    helper.moveToBack(this.modules, module);
    this.updateZIndex();
  };

  MainContent.prototype.onporttoggle = function(port) {
    var unit = new Unit({ module: this.moduleFromPort(port), port: port });

    if (!unit.visible()) {
      this.disconnectAll(unit);
    }

    this.updateRetainer();
  };

  MainContent.prototype.onportevent = function(sourcePort) {
    var sourceUnit = new Unit({ module: this.moduleFromPort(sourcePort), port: sourcePort });

    sourceUnit.plugHighlighted(true);
    this.updateEventHighlight(sourceUnit);

    setTimeout(function() {
      sourceUnit.plugHighlighted(false);
      this.updateEventHighlight(sourceUnit);
    }.bind(this), 100);
  };

  MainContent.prototype.dragStarter = function() {
    this.updateRetainer();
    this.emit('dragstart');
  };

  MainContent.prototype.dragEnder = function() {
    this.updateRetainer();
    this.emit('dragend');
  };

  MainContent.prototype.dragPortPlugStarter = function(port, context) {
    var module = this.moduleFromPort(port);
    var sourceUnit = new Unit({ module: module, port: port });
    var wire = this.createDraggingWire(sourceUnit.port);
    wire.markDirty();
    this.appendDraggingWire(sourceUnit, wire);

    context.module = module;
    context.x = sourceUnit.port.plugX();
    context.y = sourceUnit.port.plugY();
    context.wire = wire;
    context.targetUnit = null;
  };

  MainContent.prototype.dragPortPlugMover = function(port, dx, dy, context) {
    var sourceUnit = new Unit({ module: context.module, port: port });
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

  MainContent.prototype.dragPortPlugEnder = function(port, context) {
    var sourceUnit = new Unit({ module: context.module, port: port });
    this.removeDraggingWire(sourceUnit, context.targetUnit, context.wire);
  };

  MainContent.prototype.dragPortSocketStarter = function(port, context) {
    var targetUnit = new Unit({ module: this.moduleFromPort(port), port: port });
    var wire = this.attachedWire(targetUnit.port);
    var sourcePort = this.connectedSourcePort(targetUnit.port);

    this.draggingWires.push(wire);
    this.updateDragHighlight(sourcePort);
    this.updateDragHighlight(targetUnit.port);

    context.module = this.moduleFromPort(sourcePort);
    context.port = sourcePort;
    context.x = wire.targetX();
    context.y = wire.targetY();
    context.wire = wire;
    context.targetUnit = targetUnit;
  };

  MainContent.prototype.dragPortSocketMover = function(port, dx, dy, context) {
    this.dragPortPlugMover(context.port, dx, dy, context);
  };

  MainContent.prototype.dragPortSocketEnder = function(port, context) {
    this.dragPortPlugEnder(context.port, context);
  };

  MainContent.RETAINER_PADDING = 80;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainContent;
  } else {
    app.MainContent = MainContent;
  }
})(this.app || (this.app = {}));
