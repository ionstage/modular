(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Binding = app.Binding || require('../models/binding.js');
  var CircuitModule = app.CircuitModule || require('../models/circuit-module.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');
  var Module = app.Module || require('./module.js');
  var ModuleWire = app.ModuleWire || require('./module-wire.js');

  var MainContent = jCore.Component.inherits(function(props) {
    this.modules = [];
    this.draggingWires = [];
    this.lockRelations = [];
    this.bindings = [];
  });

  MainContent.prototype.retainerElement = function() {
    return this.findElement('.main-content-retainer');
  };

  MainContent.prototype.wireContainerElement = function() {
    return this.findElement('.module-wire-container');
  };

  MainContent.prototype.containerElement = function() {
    return this.findElement('.module-container');
  };

  MainContent.prototype.wireHandleContainerElement = function() {
    return this.findElement('.module-wire-handle-container');
  };

  MainContent.prototype.offsetLeft = function() {
    return dom.offsetLeft(this.element())
  };

  MainContent.prototype.offsetTop = function() {
    return dom.offsetTop(this.element());
  };

  MainContent.prototype.bottomRightX = function() {
    return this.modules.reduce(function(value, module) {
      return Math.max(module.bottomRightX(), value);
    }, 0);
  };

  MainContent.prototype.bottomRightY = function() {
    return this.modules.reduce(function(value, module) {
      return Math.max(module.bottomRightY(), value);
    }, 0);
  };

  MainContent.prototype.retainerX = function() {
    return this.bottomRightX() - 1 + MainContent.RETAINER_PADDING;
  };

  MainContent.prototype.retainerY = function() {
    return this.bottomRightY() - 1 + MainContent.RETAINER_PADDING;
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
      return (binding.sourcePort === sourcePort);
    }).map(function(binding) {
      return binding.targetPort;
    });
  };

  MainContent.prototype.connectedSourcePort = function(targetPort) {
    // socket of the target port can only be connected to one wire
    var binding = helper.find(this.bindings, function(binding) {
      return (binding.targetPort === targetPort);
    });
    return binding.sourcePort;
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
          moduleIndex: modules.indexOf(this.moduleFromPort(binding.sourcePort)),
          portName: binding.sourcePort.name(),
        },
        target: {
          moduleIndex: modules.indexOf(this.moduleFromPort(binding.targetPort)),
          portName: binding.targetPort.name(),
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
    var module = new Module(props);
    module.on('delete', this.ondelete.bind(this));
    module.on('point', this.onpoint.bind(this));
    module.on('porttoggle', this.onporttoggle.bind(this));
    module.on('portevent', this.onportevent.bind(this));
    module.on('dragstart', this.ondragstart.bind(this));
    module.on('dragend', this.ondragend.bind(this));
    module.on('plugdragstart', this.onplugdragstart.bind(this));
    module.on('plugdragmove', this.onplugdragmove.bind(this));
    module.on('plugdragend', this.onplugdragend.bind(this));
    module.on('socketdragstart', this.onsocketdragstart.bind(this));
    module.on('socketdragmove', this.onsocketdragmove.bind(this));
    module.on('socketdragend', this.onsocketdragend.bind(this));
    return module;
  };

  MainContent.prototype.createModuleWire = function(sourcePort, targetPort) {
    return new ModuleWire({
      sourceX: sourcePort.plugX(),
      sourceY: sourcePort.plugY(),
      targetX: (targetPort ? targetPort.socketX() : sourcePort.plugX()),
      targetY: (targetPort ? targetPort.socketY() : sourcePort.plugY()),
      handleType: sourcePort.type(),
      handleVisible: !targetPort,
      parentHandleElement: this.wireHandleContainerElement(),
    });
  };

  MainContent.prototype.loadModule = function(props, visiblePortNames) {
    var module = this.createModule(props);
    module.parentElement(this.containerElement());
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
    var source = this.moduleFromPort(sourcePort).circuitModuleMember(sourcePort.name());
    var target = this.moduleFromPort(targetPort).circuitModuleMember(targetPort.name());
    CircuitModule.bind(source, target);
    this.bindings.push(new Binding({
      sourcePort: sourcePort,
      targetPort: targetPort,
    }));
  };

  MainContent.prototype.unbind = function(sourcePort, targetPort) {
    var source = this.moduleFromPort(sourcePort).circuitModuleMember(sourcePort.name());
    var target = this.moduleFromPort(targetPort).circuitModuleMember(targetPort.name());
    CircuitModule.unbind(source, target);
    helper.remove(this.bindings, helper.findLast(this.bindings, function(binding) {
      return (binding.sourcePort === sourcePort && binding.targetPort === targetPort);
    }));
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
    var wire = this.createModuleWire(sourcePort, targetPort);
    wire.parentElement(this.wireContainerElement());
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
      if (binding.sourcePort === port || binding.targetPort === port) {
        this.disconnect(binding.sourcePort, binding.targetPort);
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

  MainContent.prototype.keepDraggingWire = function(sourcePort, targetPort, wire) {
    helper.remove(this.draggingWires, wire);
    this.updateDragHighlight(sourcePort);
    this.updateDragHighlight(targetPort);
  };

  MainContent.prototype.removeDraggingWire = function(sourcePort, wire) {
    helper.remove(this.draggingWires, wire);
    this.updateDragHighlight(sourcePort);
    this.unlock(LockRelation.TYPE_PLUG, sourcePort, wire);
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
    this.redrawBy('retainerX', 'retainerY', function(retainerX, retainerY) {
      dom.translate(this.retainerElement(), retainerX, retainerY);
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
    module.removeAllListeners();
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

  MainContent.prototype.onplugdragstart = function(sourcePort, context) {
    var wire = this.createModuleWire(sourcePort, null);
    wire.parentElement(this.wireContainerElement());
    this.appendDraggingWire(sourcePort, wire);

    context.x = sourcePort.plugX();
    context.y = sourcePort.plugY();
    context.wire = wire;
    context.targetPort = null;
  };

  MainContent.prototype.onplugdragmove = function(sourcePort, dx, dy, context) {
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

  MainContent.prototype.onplugdragend = function(sourcePort, context) {
    if (context.targetPort) {
      this.keepDraggingWire(sourcePort, context.targetPort, context.wire);
    } else {
      this.removeDraggingWire(sourcePort, context.wire);
      context.wire.parentElement(null);
    }
  };

  MainContent.prototype.onsocketdragstart = function(targetPort, context) {
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

  MainContent.prototype.onsocketdragmove = function(targetPort, dx, dy, context) {
    this.onplugdragmove(context.sourcePort, dx, dy, context);
  };

  MainContent.prototype.onsocketdragend = function(targetPort, context) {
    this.onplugdragend(context.sourcePort, context);
  };

  MainContent.RETAINER_PADDING = 80;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainContent;
  } else {
    app.MainContent = MainContent;
  }
})(this.app || (this.app = {}));
