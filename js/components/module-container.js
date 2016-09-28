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

  Binding.prototype.equal = function(other) {
    return Object.keys(this).every(function(key) {
      return (this[key] === other[key]);
    }.bind(this));
  };

  Binding.prototype.source = function() {
    return this.sourceModule.circuitElementMember(this.sourcePort.name());
  };

  Binding.prototype.target = function() {
    return this.targetModule.circuitElementMember(this.targetPort.name());
  };

  Binding.prototype.bind = function() {
    CircuitElement.bind(this.source(), this.target());
  };

  Binding.prototype.unbind = function() {
    CircuitElement.unbind(this.source(), this.target());
  };

  var BindingSet = helper.inherits(function() {
    BindingSet.super_.call(this);
  }, helper.Set);

  var HighlightedEvent = function(props) {
    this.sourcePort = props.sourcePort;
    this.targetPortSet = new helper.Set();
    this.wireSet = new helper.Set();
  };

  HighlightedEvent.prototype.equal = function(other) {
    return (this.sourcePort === other.sourcePort);
  };

  var HighlightedEventSet = helper.inherits(function() {
    HighlightedEventSet.super_.call(this);
  }, helper.Set);

  HighlightedEventSet.prototype.highlightEvent = function(sourcePort) {
    return this.toArray().filter(function(highlightEvent) {
      return (highlightEvent.sourcePort === sourcePort);
    })[0] || null;
  };

  HighlightedEventSet.prototype.addSourcePort = function(sourcePort) {
    this.add(new HighlightedEvent({ sourcePort: sourcePort }));
  };

  HighlightedEventSet.prototype.addTargetPort = function(sourcePort, targetPort) {
    var highlightEvent = this.highlightEvent(sourcePort);

    if (!highlightEvent)
      return;

    highlightEvent.targetPortSet.add(targetPort);
  };

  HighlightedEventSet.prototype.addWire = function(sourcePort, wire) {
    var highlightEvent = this.highlightEvent(sourcePort);

    if (!highlightEvent)
      return;

    highlightEvent.wireSet.add(wire);
  };

  HighlightedEventSet.prototype.removeSourcePort = function(sourcePort) {
    this.remove(new HighlightedEvent({ sourcePort: sourcePort }));
  };

  HighlightedEventSet.prototype.removeTargetPort = function(sourcePort, targetPort) {
    var highlightEvent = this.highlightEvent(sourcePort);

    if (!highlightEvent)
      return;

    highlightEvent.targetPortSet.remove(targetPort);
  };

  HighlightedEventSet.prototype.highlighted = function(sourcePort, highlighted) {
    var highlightEvent = this.highlightEvent(sourcePort);

    if (!highlightEvent)
      return;

    highlightEvent.sourcePort.plugHighlighted(highlighted);
    highlightEvent.targetPortSet.toArray().forEach(function(targetPort) {
      targetPort.socketHighlighted(highlighted);
    });
    highlightEvent.wireSet.toArray().forEach(function(wire) {
      wire.highlighted(highlighted);
    });
  };

  var ModuleContainer = helper.inherits(function(props) {
    ModuleContainer.super_.call(this);

    this.modules = this.prop([]);
    this.bindingSet = this.prop(new BindingSet());
    this.highlightedEventSet = this.prop(new HighlightedEventSet());
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
    var bindingSet = this.bindingSet();

    var binding = new Binding({
      sourceModule: sourceModule,
      sourcePort: sourcePort,
      targetModule: targetModule,
      targetPort: targetPort
    });

    if (bindingSet.contains(binding))
      return;

    binding.bind();
    bindingSet.add(binding);
  };

  ModuleContainer.prototype.unbind = function(sourceModule, sourcePort, targetModule, targetPort) {
    var bindingSet = this.bindingSet();

    var binding = new Binding({
      sourceModule: sourceModule,
      sourcePort: sourcePort,
      targetModule: targetModule,
      targetPort: targetPort
    });

    if (!bindingSet.contains(binding))
      return;

    binding.unbind();
    bindingSet.remove(binding);
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
    var module = new Module(helper.extend(helper.clone(props), {
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

  ModuleContainer.prototype.updatePortLabelHighlight = function(port) {
    var draggingWires = this.draggingWires();
    var isDragging = port.relations().some(function(relation) {
      return (draggingWires.indexOf(relation.wire()) !== -1);
    });
    port.labelHighlighted(isDragging);
  };

  ModuleContainer.prototype.updateModuleDeletable = function(module) {
    module.markDirty();
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
      this.bindingSet().toArray().filter(function(binding) {
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
    var highlightedEventSet = this.highlightedEventSet();

    highlightedEventSet.addSourcePort(port);

    this.bindingSet().toArray().filter(function(binding) {
      return (binding.sourceModule === module && binding.sourcePort === port);
    }).forEach(function(binding) {
      highlightedEventSet.addTargetPort(port, binding.targetPort);
      var wire = binding.targetPort.relations().filter(function(relation) {
        return (relation.type() === ModuleContainer.LOCK_TYPE_SOCKET);
      })[0].wire();
      highlightedEventSet.addWire(port, wire);
    });

    var draggingWire = this.draggingWires().filter(function(wire) {
      return port.relations().some(function(relation) {
        return (relation.wire() === wire);
      });
    })[0];

    if (draggingWire)
      highlightedEventSet.addWire(port, draggingWire);

    highlightedEventSet.highlighted(port, true);

    setTimeout(function() {
      highlightedEventSet.highlighted(port, false);
      highlightedEventSet.removeSourcePort(port);
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
    this.updatePortLabelHighlight(sourcePort);
    this.updateModuleDeletable(sourceModule);
    var highlightedEventSet = this.highlightedEventSet();
    highlightedEventSet.addWire(sourcePort, wire);
    highlightedEventSet.highlighted(sourcePort, sourcePort.plugHighlighted());
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

    var highlightedEventSet = this.highlightedEventSet();

    if (currentTargetModule && currentTargetPort) {
      this.unbind(sourceModule, sourcePort, currentTargetModule, currentTargetPort);
      // detach the wire-handle from the current target port-socket
      this.unlock(ModuleContainer.LOCK_TYPE_SOCKET, currentTargetModule, currentTargetPort, wire);
      wire.handleVisible(true);
      currentTargetPort.socketConnected(false);
      this.updatePortLabelHighlight(currentTargetPort);
      this.updateModuleDeletable(currentTargetModule);
      highlightedEventSet.removeTargetPort(sourcePort, currentTargetPort);
      currentTargetPort.socketHighlighted(false);
      highlightedEventSet.highlighted(sourcePort, sourcePort.plugHighlighted());
    }

    if (targetModule && targetPort) {
      this.bind(sourceModule, sourcePort, targetModule, targetPort);
      // attach the wire-handle to the target port-socket
      this.lock(ModuleContainer.LOCK_TYPE_SOCKET, targetModule, targetPort, wire);
      targetPort.socketConnected(true);
      wire.handleVisible(false);
      this.updatePortLabelHighlight(targetPort);
      this.updateModuleDeletable(targetModule);
      highlightedEventSet.addTargetPort(sourcePort, targetPort);
      highlightedEventSet.highlighted(sourcePort, sourcePort.plugHighlighted());
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
    this.updatePortLabelHighlight(sourcePort);
    this.updateModuleDeletable(sourceModule);

    if (targetModule && targetPort) {
      this.updatePortLabelHighlight(targetPort);
      this.updateModuleDeletable(targetModule);
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

    var binding = this.bindingSet().toArray().filter(function(binding) {
      return (binding.targetModule === targetModule && binding.targetPort === targetPort);
    })[0];

    var sourceModule = binding.sourceModule;
    var sourcePort = binding.sourcePort;

    this.updatePortLabelHighlight(sourcePort);
    this.updatePortLabelHighlight(targetPort);
    this.updateModuleDeletable(sourceModule);
    this.updateModuleDeletable(targetModule);

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
