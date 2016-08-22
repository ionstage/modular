(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitElement = app.CircuitElement || require('../models/circuit-element.js');
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
            a.targetModule === b.targetModule &&
            a.targetPort === b.targetPort);
  };

  var HighlightedEvent = function(props) {
    this.sourcePort = props.sourcePort;
    this.targetPortList = new helper.List();
    this.wireList = new helper.List();
  };

  var HighlightedEventList = helper.inherits(function() {
    BindingList.super_.call(this);
  }, helper.List);

  HighlightedEventList.prototype.equal = function(a, b) {
    return (a.sourcePort === b.sourcePort);
  };

  HighlightedEventList.prototype.highlightEvent = function(sourcePort) {
    return this.toArray().filter(function(highlightEvent) {
      return (highlightEvent.sourcePort === sourcePort);
    })[0] || null;
  };

  HighlightedEventList.prototype.addSourcePort = function(sourcePort) {
    this.add(new HighlightedEvent({ sourcePort: sourcePort }));
  };

  HighlightedEventList.prototype.addTargetPort = function(sourcePort, targetPort) {
    var highlightEvent = this.highlightEvent(sourcePort);

    if (!highlightEvent)
      return;

    highlightEvent.targetPortList.add(targetPort);
  };

  HighlightedEventList.prototype.addWire = function(sourcePort, wire) {
    var highlightEvent = this.highlightEvent(sourcePort);

    if (!highlightEvent)
      return;

    highlightEvent.wireList.add(wire);
  };

  HighlightedEventList.prototype.removeSourcePort = function(sourcePort) {
    this.remove(new HighlightedEvent({ sourcePort: sourcePort }));
  };

  HighlightedEventList.prototype.removeTargetPort = function(sourcePort, targetPort) {
    var highlightEvent = this.highlightEvent(sourcePort);

    if (!highlightEvent)
      return;

    highlightEvent.targetPortList.remove(targetPort);
  };

  HighlightedEventList.prototype.isHighlighted = function(sourcePort, isHighlighted) {
    var highlightEvent = this.highlightEvent(sourcePort);

    if (!highlightEvent)
      return;

    highlightEvent.sourcePort.plugHighlighted(isHighlighted);
    highlightEvent.targetPortList.toArray().forEach(function(targetPort) {
      targetPort.socketHighlighted(isHighlighted);
    });
    highlightEvent.wireList.toArray().forEach(function(wire) {
      wire.isHighlighted(isHighlighted);
    });
  };

  var ModuleContainer = helper.inherits(function(props) {
    ModuleContainer.super_.call(this);

    this.modules = this.prop([]);
    this.bindingList = this.prop(new BindingList());
    this.highlightedEventList = this.prop(new HighlightedEventList());
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

  ModuleContainer.prototype.connect = function(sourceModule, sourcePort, targetModule, targetPort) {
    var sourcePosition = sourceModule.plugPosition(sourcePort);
    var targetPosition = targetModule.plugPosition(targetPort);
    var wire = new ModuleWire({
      sourceX: sourcePosition.x,
      sourceY: sourcePosition.y,
      targetX: targetPosition.x,
      targetY: targetPosition.y,
      handleType: sourcePort.type(),
      parentHandleElement: this.wireHandleContainerElement()
    });
    wire.parentElement(this.wireContainerElement());
    targetPort.socketConnected(true);
    this.bind(sourceModule, sourcePort, targetModule, targetPort);
    this.lock(ModuleContainer.LOCK_TYPE_PLUG, sourceModule, sourcePort, wire);
    this.lock(ModuleContainer.LOCK_TYPE_SOCKET, targetModule, targetPort, wire);
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
    var module = new Module(helper.extend({}, props, {
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
    this.modules().push(module);
    this.updateZIndex();
    this.markDirty();
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

  ModuleContainer.prototype.updatePortHighlight = function(port) {
    var draggingWires = this.draggingWires();
    var isDragging = port.relations().some(function(relation) {
      return (draggingWires.indexOf(relation.wire()) !== -1);
    });
    port.isHighlighted(isDragging);
  };

  ModuleContainer.prototype.deleter = function(module) {
    var modules = this.modules();
    var index = modules.indexOf(module);

    if (index === -1)
      return;

    modules.splice(index, 1);
    this.updateZIndex();
    this.markDirty();
  };

  ModuleContainer.prototype.fronter = function(module) {
    this.toFront(module);
    this.updateZIndex();
  };

  ModuleContainer.prototype.portToggler = function(module, port) {
    if (!port.visible()) {
      // remove all connections with hidden port
      var bindings = this.bindingList().toArray().filter(function(binding) {
        return ((binding.sourceModule === module && binding.sourcePort === port) ||
                (binding.targetModule === module && binding.targetPort === port));
      }).forEach(function(binding) {
        var sourceModule = binding.sourceModule;
        var sourcePort = binding.sourcePort;
        var targetModule = binding.targetModule;
        var targetPort = binding.targetPort;
        var wire = binding.targetPort.relations().filter(function(relation) {
          return (relation.type() === ModuleContainer.LOCK_TYPE_SOCKET);
        })[0].wire();
        this.unbind(sourceModule, sourcePort, targetModule, targetPort);
        this.unlock(ModuleContainer.LOCK_TYPE_PLUG, sourceModule, sourcePort, wire);
        this.unlock(ModuleContainer.LOCK_TYPE_SOCKET, targetModule, targetPort, wire);
        targetPort.socketConnected(false);
        wire.parentElement(null);
      }.bind(this));
    }

    // resize the element
    this.markDirty();
  };

  ModuleContainer.prototype.portEventer = function(module, port) {
    var targetPorts = [];
    var wires = [];

    this.bindingList().toArray().filter(function(binding) {
      return (binding.sourceModule === module && binding.sourcePort === port);
    }).forEach(function(binding) {
      targetPorts.push(binding.targetPort);
      var wire = binding.targetPort.relations().filter(function(relation) {
        return (relation.type() === ModuleContainer.LOCK_TYPE_SOCKET);
      })[0].wire();
      wires.push(wire);
    });

    var highlightedEventList = this.highlightedEventList();

    highlightedEventList.addSourcePort(port);

    targetPorts.forEach(function(targetPort) {
      highlightedEventList.addTargetPort(port, targetPort);
    });

    wires.forEach(function(wire) {
      highlightedEventList.addWire(port, wire);
    });

    var draggingWire = this.draggingWires().filter(function(wire) {
      return port.relations().some(function(relation) {
        return (relation.wire() === wire);
      });
    })[0];

    if (draggingWire)
      highlightedEventList.addWire(port, draggingWire);

    highlightedEventList.isHighlighted(port, true);

    setTimeout(function() {
      highlightedEventList.isHighlighted(port, false);
      highlightedEventList.removeSourcePort(port);
    }, 100);
  };

  ModuleContainer.prototype.dragStarter = function() {
    this.dragCount(this.dragCount() + 1);
  };

  ModuleContainer.prototype.dragEnder = function() {
    this.dragCount(this.dragCount() - 1);
  };

  ModuleContainer.prototype.dragPortPlugStarter = function(sourceModule, sourcePort, context) {
    var position = sourceModule.plugPosition(sourcePort);
    var x = position.x;
    var y = position.y;
    var wire = new ModuleWire({
      sourceX: x,
      sourceY: y,
      targetX: x,
      targetY: y,
      handleType: sourcePort.type(),
      handleVisible: true,
      parentHandleElement: this.wireHandleContainerElement()
    });
    wire.parentElement(this.wireContainerElement());
    this.lock(ModuleContainer.LOCK_TYPE_PLUG, sourceModule, sourcePort, wire);
    this.draggingWires().push(wire);
    this.updatePortHighlight(sourcePort);
    sourceModule.deletable(!sourcePort.isHighlighted());
    var highlightedEventList = this.highlightedEventList();
    highlightedEventList.addWire(sourcePort, wire);
    highlightedEventList.isHighlighted(sourcePort, sourcePort.plugHighlighted());
    context.x = x;
    context.y = y;
    context.wire = wire;
    context.type = sourcePort.type();
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

    var highlightedEventList = this.highlightedEventList();

    if (currentTargetModule && currentTargetPort) {
      this.unbind(sourceModule, sourcePort, currentTargetModule, currentTargetPort);
      // detach the wire-handle from the current target port-socket
      this.unlock(ModuleContainer.LOCK_TYPE_SOCKET, currentTargetModule, currentTargetPort, wire);
      wire.handleVisible(true);
      currentTargetPort.socketConnected(false);
      this.updatePortHighlight(currentTargetPort);
      currentTargetModule.deletable(!currentTargetPort.isHighlighted());
      highlightedEventList.removeTargetPort(sourcePort, currentTargetPort);
      currentTargetPort.socketHighlighted(false);
      highlightedEventList.isHighlighted(sourcePort, sourcePort.plugHighlighted());
    }

    if (targetModule && targetPort) {
      this.bind(sourceModule, sourcePort, targetModule, targetPort);
      // attach the wire-handle to the target port-socket
      this.lock(ModuleContainer.LOCK_TYPE_SOCKET, targetModule, targetPort, wire);
      targetPort.socketConnected(true);
      wire.handleVisible(false);
      this.updatePortHighlight(targetPort);
      targetModule.deletable(!targetPort.isHighlighted());
      highlightedEventList.addTargetPort(sourcePort, targetPort);
      highlightedEventList.isHighlighted(sourcePort, sourcePort.plugHighlighted());
    }

    context.targetModule = targetModule;
    context.targetPort = targetPort;
  };

  ModuleContainer.prototype.dragPortPlugEnder = function(sourceModule, sourcePort, context) {
    var draggingWires = this.draggingWires();
    var wire = context.wire;
    var targetModule = context.targetModule;
    var targetPort = context.targetPort;

    draggingWires.splice(draggingWires.indexOf(wire), 1);
    this.updatePortHighlight(sourcePort);
    sourceModule.deletable(!sourcePort.isHighlighted());

    if (targetModule && targetPort) {
      this.updatePortHighlight(targetPort);
      targetModule.deletable(!targetPort.isHighlighted());
      return;
    }

    // remove the dragging wire
    this.unlock(ModuleContainer.LOCK_TYPE_PLUG, sourceModule, sourcePort, wire);
    wire.parentElement(null);
  };

  ModuleContainer.prototype.dragPortSocketStarter = function(targetModule, targetPort, context) {
    var relation = targetPort.relations().filter(function(relation) {
      return (relation.type() === ModuleWireRelation.TYPE_TARGET);
    })[0];

    var wire = relation.wire();
    this.draggingWires().push(wire);

    context.x = wire.targetX();
    context.y = wire.targetY();
    context.wire = wire;
    context.type = targetPort.type();

    var binding = this.bindingList().toArray().filter(function(binding) {
      return (binding.targetModule === targetModule && binding.targetPort === targetPort);
    })[0];

    var sourceModule = binding.sourceModule;
    var sourcePort = binding.sourcePort;

    this.updatePortHighlight(sourcePort);
    this.updatePortHighlight(targetPort);
    sourceModule.deletable(!sourcePort.isHighlighted());
    targetModule.deletable(!targetPort.isHighlighted());

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

  ModuleContainer.LOCK_TYPE_PLUG = ModuleWireRelation.TYPE_SOURCE;
  ModuleContainer.LOCK_TYPE_SOCKET = ModuleWireRelation.TYPE_TARGET;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleContainer;
  else
    app.ModuleContainer = ModuleContainer;
})(this.app || (this.app = {}));
