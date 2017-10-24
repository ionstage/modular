(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Binding = app.Binding || require('../models/binding.js');
  var CircuitModule = app.CircuitModule || require('../models/circuit-module.js');
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
    return this.bindings.filter(function(binding) {
      return (binding.sourceUnit.port === sourcePort);
    }).map(function(binding) {
      return binding.targetUnit.port;
    });
  };

  MainContent.prototype.connectedSourcePort = function(targetPort) {
    // socket of the target port can only be connected to one wire
    var binding = this.bindings.filter(function(binding) {
      return (binding.targetUnit.port === targetPort);
    })[0];
    return (binding ? binding.sourceUnit.port : null);
  };

  MainContent.prototype.portFromSocketPosition = function(x, y) {
    var port = null;
    for (var i = this.modules.length - 1; i >= 0; i--) {
      port = this.modules[i].portFromSocketPosition(x, y);
      if (port) {
        break;
      }
    }
    return port;
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
      return {
        source: {
          moduleIndex: modules.indexOf(this.moduleFromPort(binding.sourceUnit.port)),
          portName: binding.sourceUnit.port.name(),
        },
        target: {
          moduleIndex: modules.indexOf(this.moduleFromPort(binding.targetUnit.port)),
          portName: binding.targetUnit.port.name(),
        },
      };
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
      var sourceModule = modules[source.moduleIndex];
      var targetModule = modules[target.moduleIndex];
      var sourcePort = (sourceModule ? sourceModule.port(source.portName) : null);
      var targetPort = (targetModule ? targetModule.port(target.portName) : null);
      if (!sourcePort || !targetPort || !this.canConnect(sourcePort, targetPort)) {
        throw new Error('Invalid connection');
      }
      return { source: sourcePort, target: targetPort };
    }.bind(this))).then(function(portMaps) {
      portMaps.forEach(function(portMap) {
        this.connect(portMap.source, portMap.target);
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
    module.on('dragstart', this.ondragstart.bind(this));
    module.on('dragend', this.ondragend.bind(this));
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

  MainContent.prototype.bind = function(sourcePort, targetPort) {
    var binding = new Binding({
      sourceUnit: new Unit({ module: this.moduleFromPort(sourcePort), port: sourcePort }),
      targetUnit: new Unit({ module: this.moduleFromPort(targetPort), port: targetPort }),
    });
    CircuitModule.bind(binding.sourceUnit.circuitModuleMember(), binding.targetUnit.circuitModuleMember());
    this.bindings.push(binding);
  };

  MainContent.prototype.unbind = function(sourcePort, targetPort) {
    var binding = helper.findLast(this.bindings, function(binding) {
      return (binding.sourceUnit.port === sourcePort && binding.targetUnit.port === targetPort);
    });
    CircuitModule.unbind(binding.sourceUnit.circuitModuleMember(), binding.targetUnit.circuitModuleMember());
    helper.remove(this.bindings, binding);
  };

  MainContent.prototype.canConnect = function(sourcePort, targetPort) {
    if (sourcePort.type() !== targetPort.type()) {
      return false;
    }
    if (sourcePort.plugDisabled() || targetPort.socketDisabled()) {
      return false;
    }
    if (!sourcePort.visible() || !targetPort.visible()) {
      return false;
    }
    if (targetPort.socketConnected()) {
      return false;
    }
    return true;
  };

  MainContent.prototype.connect = function(sourcePort, targetPort) {
    var wire = this.createConnectingWire(sourcePort, targetPort);
    wire.markDirty();
    targetPort.socketConnected(true);
    this.bind(sourcePort, targetPort);
    this.lock(LockRelation.TYPE_PLUG, sourcePort, wire);
    this.lock(LockRelation.TYPE_SOCKET, targetPort, wire);
    this.updateEventHighlight(sourcePort);
  };

  MainContent.prototype.disconnect = function(sourcePort, targetPort) {
    var wire = this.attachedWire(targetPort);
    wire.parentElement(null);
    targetPort.socketConnected(false);
    this.unbind(sourcePort, targetPort);
    this.unlock(LockRelation.TYPE_PLUG, sourcePort, wire);
    this.unlock(LockRelation.TYPE_SOCKET, targetPort, wire);
    targetPort.socketHighlighted(false);
  };

  MainContent.prototype.disconnectAll = function(port) {
    this.bindings.slice().forEach(function(binding) {
      if (binding.sourceUnit.port === port || binding.targetUnit.port === port) {
        this.disconnect(binding.sourceUnit.port, binding.targetUnit.port);
      }
    }.bind(this));
  };

  MainContent.prototype.appendDraggingWire = function(sourcePort, wire) {
    this.lock(LockRelation.TYPE_PLUG, sourcePort, wire);
    this.updateEventHighlight(sourcePort);
    this.draggingWires.push(wire);
    this.updateDragHighlight(sourcePort);
  };

  MainContent.prototype.attachDraggingWire = function(sourcePort, targetPort, wire) {
    wire.handleVisible(false);
    targetPort.socketConnected(true);
    this.bind(sourcePort, targetPort);
    this.lock(LockRelation.TYPE_SOCKET, targetPort, wire);
    this.updateEventHighlight(sourcePort);
    this.updateDragHighlight(targetPort);
  };

  MainContent.prototype.detachDraggingWire = function(sourcePort, targetPort, wire) {
    wire.handleVisible(true);
    targetPort.socketConnected(false);
    this.unbind(sourcePort, targetPort);
    this.unlock(LockRelation.TYPE_SOCKET, targetPort, wire);
    targetPort.socketHighlighted(false);
    this.updateDragHighlight(targetPort);
  };

  MainContent.prototype.removeDraggingWire = function(sourcePort, targetPort, wire) {
    helper.remove(this.draggingWires, wire);
    this.updateDragHighlight(sourcePort);

    // keep the element of wire if the target unit is connected with the wire
    if (targetPort) {
      this.updateDragHighlight(targetPort);
    } else {
      this.unlock(LockRelation.TYPE_PLUG, sourcePort, wire);
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

  MainContent.prototype.updateEventHighlight = function(sourcePort) {
    var highlighted = sourcePort.plugHighlighted();
    this.connectedTargetPorts(sourcePort).forEach(function(targetPort) {
      targetPort.socketHighlighted(highlighted);
    });
    this.lockedWires(LockRelation.TYPE_PLUG, sourcePort).forEach(function(wire) {
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
    if (!port.visible()) {
      this.disconnectAll(port);
    }
    this.updateRetainer();
  };

  MainContent.prototype.onportevent = function(sourcePort) {
    sourcePort.plugHighlighted(true);
    this.updateEventHighlight(sourcePort);
    setTimeout(function() {
      sourcePort.plugHighlighted(false);
      this.updateEventHighlight(sourcePort);
    }.bind(this), 100);
  };

  MainContent.prototype.ondragstart = function() {
    this.updateRetainer();
    this.emit('dragstart');
  };

  MainContent.prototype.ondragend = function() {
    this.updateRetainer();
    this.emit('dragend');
  };

  MainContent.prototype.dragPortPlugStarter = function(sourcePort, context) {
    var wire = this.createDraggingWire(sourcePort);
    wire.markDirty();
    this.appendDraggingWire(sourcePort, wire);

    context.x = sourcePort.plugX();
    context.y = sourcePort.plugY();
    context.wire = wire;
    context.targetPort = null;
  };

  MainContent.prototype.dragPortPlugMover = function(sourcePort, dx, dy, context) {
    var x = context.x + dx;
    var y = context.y + dy;
    var currentTargetPort = context.targetPort;
    var port = this.portFromSocketPosition(x, y);

    if (port && currentTargetPort && port === currentTargetPort) {
      // fix the target position of the wire
      return;
    }

    var wire = context.wire;
    wire.targetX(x);
    wire.targetY(y);

    if (currentTargetPort) {
      this.detachDraggingWire(sourcePort, currentTargetPort, wire);
    }

    var targetPort = (port && this.canConnect(sourcePort, port) ? port : null);
    if (targetPort) {
      this.attachDraggingWire(sourcePort, targetPort, wire);
    }

    context.targetPort = targetPort;
  };

  MainContent.prototype.dragPortPlugEnder = function(sourcePort, context) {
    this.removeDraggingWire(sourcePort, context.targetPort, context.wire);
  };

  MainContent.prototype.dragPortSocketStarter = function(targetPort, context) {
    var wire = this.attachedWire(targetPort);
    var sourcePort = this.connectedSourcePort(targetPort);

    this.draggingWires.push(wire);
    this.updateDragHighlight(sourcePort);
    this.updateDragHighlight(targetPort);

    context.x = wire.targetX();
    context.y = wire.targetY();
    context.wire = wire;
    context.sourcePort = sourcePort;
    context.targetPort = targetPort;
  };

  MainContent.prototype.dragPortSocketMover = function(targetPort, dx, dy, context) {
    this.dragPortPlugMover(context.sourcePort, dx, dy, context);
  };

  MainContent.prototype.dragPortSocketEnder = function(targetPort, context) {
    this.dragPortPlugEnder(context.sourcePort, context);
  };

  MainContent.RETAINER_PADDING = 80;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainContent;
  } else {
    app.MainContent = MainContent;
  }
})(this.app || (this.app = {}));
