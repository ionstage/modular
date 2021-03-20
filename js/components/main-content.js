(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitModule = app.CircuitModule || require('../models/circuit-module.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');
  var Module = app.Module || require('./module.js');
  var ModulePort = app.ModulePort || require('./module-port.js');
  var Wire = app.Wire || require('./wire.js');
  var WireHandle = app.WireHandle || require('./wire-handle.js');

  var MainContent = jCore.Component.inherits(function() {
    this.moduleContainer = new MainContent.ModuleContainer({ element: this.findElement('.module-container') });
    this.wireContainer = new MainContent.WireContainer({ element: this.findElement('.wire-container') });
    this.wireHandleContainer = new MainContent.WireHandleContainer({ element: this.findElement('.wire-handle-container') });
  });

  MainContent.prototype.offsetLeft = function() {
    return dom.offsetLeft(this.element())
  };

  MainContent.prototype.offsetTop = function() {
    return dom.offsetTop(this.element());
  };

  MainContent.prototype.toData = function() {
    return this.moduleContainer.toData();
  };

  MainContent.prototype.load = function(data) {
    return this.moduleContainer.load(data);
  };

  MainContent.prototype.loadModule = function(props, visiblePortNames) {
    return this.moduleContainer.loadModule(props, visiblePortNames, null);
  };

  MainContent.prototype.clear = function() {
    this.moduleContainer.clear();
  };

  MainContent.prototype.portEventHighlighted = function(sourcePort, highlighted) {
    sourcePort.plugHighlighted(highlighted);
    this.moduleContainer.portEventHighlighted(sourcePort, highlighted)
    this.wireContainer.portEventHighlighted(sourcePort, highlighted);
    this.wireHandleContainer.portEventHighlighted(sourcePort, highlighted);
  };

  MainContent.prototype.oninit = function() {
    dom.on(this.element(), dom.eventType('start'), this.onpoint.bind(this));
    this.moduleContainer.on('connect', this.wireContainer.onconnect.bind(this.wireContainer));
    this.moduleContainer.on('disconnect', this.wireContainer.ondisconnect.bind(this.wireContainer));
    this.moduleContainer.on('portevent', this.onportevent.bind(this));
    this.moduleContainer.on('dragstart', this.emit.bind(this, 'dragstart'));
    this.moduleContainer.on('dragend', this.emit.bind(this, 'dragend'));
    this.moduleContainer.on('handlestart', this.wireContainer.onhandlestart.bind(this.wireContainer));
    this.moduleContainer.on('handlemove', this.wireContainer.onhandlemove.bind(this.wireContainer));
    this.moduleContainer.on('handleend', this.wireContainer.onhandleend.bind(this.wireContainer));
    this.moduleContainer.on('handleattach', this.wireContainer.onhandleattach.bind(this.wireContainer));
    this.moduleContainer.on('handledetach', this.wireContainer.onhandledetach.bind(this.wireContainer));
    this.moduleContainer.on('handlestart', this.wireHandleContainer.onhandlestart.bind(this.wireHandleContainer));
    this.moduleContainer.on('handlemove', this.wireHandleContainer.onhandlemove.bind(this.wireHandleContainer));
    this.moduleContainer.on('handleend', this.wireHandleContainer.onhandleend.bind(this.wireHandleContainer));
    this.moduleContainer.on('handleattach', this.wireHandleContainer.onhandleattach.bind(this.wireHandleContainer));
    this.moduleContainer.on('handledetach', this.wireHandleContainer.onhandledetach.bind(this.wireHandleContainer));
  };

  MainContent.prototype.onpoint = function(event) {
    // remove keyboard focus when pointing background
    if (dom.target(event) === this.element()) {
      dom.removeFocus();
    }
  };

  MainContent.prototype.onportevent = function(sourcePort) {
    this.portEventHighlighted(sourcePort, true);
    setTimeout(this.portEventHighlighted.bind(this), 100, sourcePort, false);
  };

  MainContent.ModuleContainer = (function() {
    var ModuleContainer = jCore.Component.inherits(function() {
      this.modules = [];
      this.bindings = [];
      this.retainer = new ModuleContainer.Retainer({ element: this.findElement('.module-container-retainer') });
    });

    ModuleContainer.prototype.bottomRightX = function() {
      return this.modules.reduce(function(value, module) {
        return Math.max(module.bottomRightX(), value);
      }, 0);
    };

    ModuleContainer.prototype.bottomRightY = function() {
      return this.modules.reduce(function(value, module) {
        return Math.max(module.bottomRightY(), value);
      }, 0);
    };

    ModuleContainer.prototype.retainerX = function() {
      return (this.modules.length > 0 ? this.bottomRightX() + this.retainer.margin() : 0);
    };

    ModuleContainer.prototype.retainerY = function() {
      return (this.modules.length > 0 ? this.bottomRightY() + this.retainer.margin() : 0);
    };

    ModuleContainer.prototype.portFromSocketPosition = function(x, y) {
      for (var i = this.modules.length - 1; i >= 0; i--) {
        var port = this.modules[i].portFromSocketPosition(x, y);
        if (port) {
          return port;
        }
      }
      return null;
    };

    ModuleContainer.prototype.connectedSourcePort = function(targetPort) {
      // socket of the target port can only be connected to one source port
      var binding = helper.find(this.bindings, function(binding) {
        return (binding.targetPort === targetPort);
      });
      return binding.sourcePort;
    };

    ModuleContainer.prototype.toData = function() {
      return {
        modules: this.modules.map(function(module) {
          return module.toData();
        }),
        connections: this.bindings.map(function(binding) {
         return binding.toData(this.modules);
        }.bind(this)),
      };
    };

    ModuleContainer.prototype.createModule = function(props) {
      var module = new Module(props);
      module.on('delete', this.ondelete.bind(this));
      module.on('point', this.onpoint.bind(this));
      module.on('portshow', this.onportshow.bind(this));
      module.on('porthide', this.onporthide.bind(this));
      module.on('portevent', this.emit.bind(this, 'portevent'));
      module.on('dragstart', this.emit.bind(this, 'dragstart'));
      module.on('dragend', this.ondragend.bind(this));
      module.on('plugdragstart', this.onplugdragstart.bind(this));
      module.on('plugdragmove', this.onplugdragmove.bind(this));
      module.on('plugdragend', this.onplugdragend.bind(this));
      module.on('socketdragstart', this.onsocketdragstart.bind(this));
      module.on('socketdragmove', this.onsocketdragmove.bind(this));
      module.on('socketdragend', this.onsocketdragend.bind(this));
      return module;
    };

    ModuleContainer.prototype.load = function(data) {
      return this.loadModules(data.modules).then(function(modules) {
        return this.loadConnections(data.connections, modules);
      }.bind(this));
    };

    ModuleContainer.prototype.loadModule = function(props, visiblePortNames, serializedValue) {
      var module = this.createModule(props);
      module.parentElement(this.element());
      this.modules.push(module);
      this.refresh();
      return module.load(visiblePortNames, serializedValue);
    };

    ModuleContainer.prototype.loadModules = function(modulesData) {
      return Promise.all(modulesData.map(function(moduleData) {
        return this.loadModule(moduleData.props, moduleData.visiblePortNames, moduleData.serializedValue);
      }.bind(this)));
    };

    ModuleContainer.prototype.loadConnections = function(connectionsData, modules) {
      return Promise.resolve(connectionsData.map(function(connectionData) {
        return ModuleContainer.Binding.fromData(connectionData, modules);
      })).then(function(bindings) {
        bindings.forEach(function(binding) {
          if (!this.canConnect(binding.sourcePort, binding.targetPort)) {
            throw new Error('Invalid connection');
          }
          this.connect(binding.sourcePort, binding.targetPort);
        }.bind(this));
      }.bind(this));
    };

    ModuleContainer.prototype.removeModule = function(module) {
      this.disconnectByModule(module);
      module.removeAllListeners();
      module.parentElement(null);
      helper.remove(this.modules, module);
      this.refresh();
    };

    ModuleContainer.prototype.clear = function() {
      this.modules.slice().reverse().forEach(function(module) {
        this.removeModule(module);
      }.bind(this));
    };

    ModuleContainer.prototype.canConnect = function(sourcePort, targetPort) {
      if (!sourcePort || !targetPort) {
        return false;
      }
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

    ModuleContainer.prototype.connect = function(sourcePort, targetPort) {
      this.attach(sourcePort, targetPort);
      this.emit('connect', sourcePort, targetPort);
    };

    ModuleContainer.prototype.disconnect = function(sourcePort, targetPort) {
      this.detach(sourcePort, targetPort);
      this.emit('disconnect', sourcePort, targetPort);
    };

    ModuleContainer.prototype.disconnectByModule = function(module) {
      module.ports.forEach(function(port) {
        this.disconnectByPort(port);
      }.bind(this));
    };

    ModuleContainer.prototype.disconnectByPort = function(port) {
      this.bindings.slice().forEach(function(binding) {
        if (binding.sourcePort === port || binding.targetPort === port) {
          this.disconnect(binding.sourcePort, binding.targetPort);
        }
      }.bind(this));
    };

    ModuleContainer.prototype.attach = function(sourcePort, targetPort) {
      this.bind(sourcePort, targetPort);
      targetPort.socketConnected(true);
      targetPort.socketHighlighted(sourcePort.plugHighlighted());
    };

    ModuleContainer.prototype.detach = function(sourcePort, targetPort) {
      this.unbind(sourcePort, targetPort);
      targetPort.socketConnected(false);
      targetPort.socketHighlighted(false);
    };

    ModuleContainer.prototype.bind = function(sourcePort, targetPort) {
      CircuitModule.bind(sourcePort.member, targetPort.member);
      this.bindings.push(new ModuleContainer.Binding({
        sourcePort: sourcePort,
        targetPort: targetPort,
      }));
    };

    ModuleContainer.prototype.unbind = function(sourcePort, targetPort) {
      CircuitModule.unbind(sourcePort.member, targetPort.member);
      if (targetPort.type() === ModulePort.TYPE_DATA) {
        // send empty value to disconnected 'data' port
        targetPort.member(null);
      }
      helper.remove(this.bindings, helper.findLast(this.bindings, function(binding) {
        return (binding.sourcePort === sourcePort && binding.targetPort === targetPort);
      }));
    };

    ModuleContainer.prototype.portEventHighlighted = function(sourcePort, highlighted) {
      this.bindings.forEach(function(binding) {
        if (binding.sourcePort === sourcePort) {
          binding.targetPort.socketHighlighted(highlighted);
        }
      });
    };

    ModuleContainer.prototype.refresh = function() {
      // reset z-index of each module
      this.modules.forEach(function(module, index) {
        module.zIndex(index);
      });

      // move retainer to the proper position
      this.retainer.x(this.retainerX());
      this.retainer.y(this.retainerY());
    };

    ModuleContainer.prototype.handlestart = function(sourcePort, targetPort, context) {
      sourcePort.incrementHighlightCount();
      if (targetPort) {
        targetPort.incrementHighlightCount();
      }
      context.context = {};
      this.emit('handlestart', sourcePort, targetPort, context.context);
    };

    ModuleContainer.prototype.handlemove = function(sourcePort, targetPort, context, x, y) {
      var port = this.portFromSocketPosition(x, y);

      if (port && targetPort && port === targetPort) {
        // fix the position of the dragging handle
        return;
      }

      this.emit('handlemove', sourcePort, targetPort, context.context, x, y);

      if (targetPort) {
        this.handledetach(sourcePort, targetPort, context);
      }

      targetPort = (this.canConnect(sourcePort, port) ? port : null);
      if (targetPort) {
        this.handleattach(sourcePort, targetPort, context);
      }

      context.targetPort = targetPort;
    };

    ModuleContainer.prototype.handleend = function(sourcePort, targetPort, context) {
      sourcePort.decrementHighlightCount();
      if (targetPort) {
        targetPort.decrementHighlightCount();
      }
      this.emit('handleend', sourcePort, targetPort, context.context);
    };

    ModuleContainer.prototype.handleattach = function(sourcePort, targetPort, context) {
      this.attach(sourcePort, targetPort);
      targetPort.incrementHighlightCount();
      this.emit('handleattach', sourcePort, targetPort, context.context);
    };

    ModuleContainer.prototype.handledetach = function(sourcePort, targetPort, context) {
      this.detach(sourcePort, targetPort);
      targetPort.decrementHighlightCount();
      this.emit('handledetach', sourcePort, targetPort, context.context);
    };

    ModuleContainer.prototype.ondelete = function(module) {
      this.removeModule(module);
    };

    ModuleContainer.prototype.onpoint = function(module) {
      helper.moveToBack(this.modules, module);
      this.refresh();
    };

    ModuleContainer.prototype.onportshow = function() {
      this.refresh();
    };

    ModuleContainer.prototype.onporthide = function(port) {
      this.disconnectByPort(port);
      this.refresh();
    };

    ModuleContainer.prototype.ondragend = function() {
      this.refresh();
      this.emit('dragend');
    };

    ModuleContainer.prototype.onplugdragstart = function(port, context) {
      context.x = port.plugX();
      context.y = port.plugY();
      context.targetPort = null;
      this.handlestart(port, context.targetPort, context);
    };

    ModuleContainer.prototype.onplugdragmove = function(port, context, dx, dy) {
      this.handlemove(port, context.targetPort, context, context.x + dx, context.y + dy);
    };

    ModuleContainer.prototype.onplugdragend = function(port, context) {
      this.handleend(port, context.targetPort, context);
    };

    ModuleContainer.prototype.onsocketdragstart = function(port, context) {
      context.x = port.socketX();
      context.y = port.socketY();
      context.sourcePort = this.connectedSourcePort(port);
      context.targetPort = port;
      this.handlestart(context.sourcePort, context.targetPort, context);
    };

    ModuleContainer.prototype.onsocketdragmove = function(port, context, dx, dy) {
      this.handlemove(context.sourcePort, context.targetPort, context, context.x + dx, context.y + dy);
    };

    ModuleContainer.prototype.onsocketdragend = function(port, context) {
      this.handleend(context.sourcePort, context.targetPort, context);
    };

    ModuleContainer.Binding = (function() {
      var Binding = function(props) {
        this.sourcePort = props.sourcePort;
        this.targetPort = props.targetPort;
      };

      Binding.prototype.toData = function(modules) {
        return {
          source: {
            moduleIndex: modules.indexOf(this.sourcePort.module),
            portName: this.sourcePort.name(),
          },
          target: {
            moduleIndex: modules.indexOf(this.targetPort.module),
            portName: this.targetPort.name(),
          },
        };
      };

      Binding.fromData = function(data, modules) {
        var sourceModule = modules[data.source.moduleIndex];
        var targetModule = modules[data.target.moduleIndex];
        return new Binding({
          sourcePort: (sourceModule ? sourceModule.port(data.source.portName) : null),
          targetPort: (targetModule ? targetModule.port(data.target.portName) : null),
        });
      };

      return Binding;
    })();

    ModuleContainer.Retainer = (function() {
      var Retainer = jCore.Component.inherits(function() {
        this.x = this.prop(0);
        this.y = this.prop(0);
        this.margin = this.prop(80);
      });

      Retainer.prototype.onredraw = function() {
        this.redrawBy('x', 'y', function(x, y) {
          dom.translate(this.element(), x, y);
        });
      };

      return Retainer;
    })();

    return ModuleContainer;
  })();

  MainContent.WireContainer = (function() {
    var WireContainer = jCore.Component.inherits(function() {
      this.lockRelations = [];
    });

    WireContainer.prototype.lockedWires = function(type, port) {
      return this.lockRelations.filter(function(relation) {
        return (relation.type === type && relation.port === port);
      }).map(function(relation) {
        return relation.wire;
      });
    };

    WireContainer.prototype.attachedWire = function(targetPort) {
      return this.lockedWires(LockRelation.TYPE_SOCKET, targetPort)[0];
    };

    WireContainer.prototype.createWire = function(sourcePort, targetPort) {
      return new Wire({
        sourceX: sourcePort.plugX(),
        sourceY: sourcePort.plugY(),
        targetX: (targetPort ? targetPort.socketX() : sourcePort.plugX()),
        targetY: (targetPort ? targetPort.socketY() : sourcePort.plugY()),
        highlighted: sourcePort.plugHighlighted(),
      });
    };

    WireContainer.prototype.lock = function(type, port, wire) {
      var relation = new LockRelation({
        type: type,
        port: port,
        wire: wire,
      });
      port.addRelation(relation);
      this.lockRelations.push(relation);
    };

    WireContainer.prototype.unlock = function(type, port, wire) {
      var relation = helper.findLast(this.lockRelations, function(relation) {
        return (relation.type === type && relation.port === port && relation.wire === wire);
      });
      port.removeRelation(relation);
      helper.remove(this.lockRelations, relation);
    };

    WireContainer.prototype.portEventHighlighted = function(sourcePort, highlighted) {
      this.lockedWires(LockRelation.TYPE_PLUG, sourcePort).forEach(function(wire) {
        wire.highlighted(highlighted);
      });
    };

    WireContainer.prototype.onconnect = function(sourcePort, targetPort) {
      var wire = this.createWire(sourcePort, targetPort);
      wire.parentElement(this.element());
      this.lock(LockRelation.TYPE_PLUG, sourcePort, wire);
      this.lock(LockRelation.TYPE_SOCKET, targetPort, wire);
    };

    WireContainer.prototype.ondisconnect = function(sourcePort, targetPort) {
      var wire = this.attachedWire(targetPort);
      wire.parentElement(null);
      this.unlock(LockRelation.TYPE_PLUG, sourcePort, wire);
      this.unlock(LockRelation.TYPE_SOCKET, targetPort, wire);
    };

    WireContainer.prototype.onhandlestart = function(sourcePort, targetPort, context) {
      context.wire = (targetPort ? this.attachedWire(targetPort) : this.createWire(sourcePort, null));
      if (!targetPort) {
        context.wire.parentElement(this.element());
        this.lock(LockRelation.TYPE_PLUG, sourcePort, context.wire);
      }
    };

    WireContainer.prototype.onhandlemove = function(sourcePort, targetPort, context, x, y) {
      context.wire.targetX(x);
      context.wire.targetY(y);
    };

    WireContainer.prototype.onhandleend = function(sourcePort, targetPort, context) {
      if (!targetPort) {
        this.unlock(LockRelation.TYPE_PLUG, sourcePort, context.wire);
        context.wire.parentElement(null);
      }
    };

    WireContainer.prototype.onhandleattach = function(sourcePort, targetPort, context) {
      this.lock(LockRelation.TYPE_SOCKET, targetPort, context.wire);
    };

    WireContainer.prototype.onhandledetach = function(sourcePort, targetPort, context) {
      this.unlock(LockRelation.TYPE_SOCKET, targetPort, context.wire);
    };

    return WireContainer;
  })();

  MainContent.WireHandleContainer = (function() {
    var WireHandleContainer = jCore.Component.inherits(function() {
      this.wireHandles = [];
    });

    WireHandleContainer.prototype.createWireHandle = function(sourcePort, targetPort) {
      return new WireHandle({
        cx: (targetPort ? targetPort.socketX() : sourcePort.plugX()),
        cy: (targetPort ? targetPort.socketY() : sourcePort.plugY()),
        type: sourcePort.type(),
        visible: !targetPort,
        highlighted: sourcePort.plugHighlighted(),
        port: sourcePort,
      });
    };

    WireHandleContainer.prototype.portEventHighlighted = function(sourcePort, highlighted) {
      this.wireHandles.forEach(function(wireHandle) {
        if (wireHandle.port === sourcePort) {
          wireHandle.highlighted(highlighted);
        }
      });
    };

    WireHandleContainer.prototype.onhandlestart = function(sourcePort, targetPort, context) {
      context.wireHandle = this.createWireHandle(sourcePort, targetPort);
      context.wireHandle.parentElement(this.element());
      this.wireHandles.push(context.wireHandle);
    };

    WireHandleContainer.prototype.onhandlemove = function(sourcePort, targetPort, context, x, y) {
      context.wireHandle.cx(x);
      context.wireHandle.cy(y);
    };

    WireHandleContainer.prototype.onhandleend = function(sourcePort, targetPort, context) {
      context.wireHandle.parentElement(null);
      helper.remove(this.wireHandles, context.wireHandle);
    };

    WireHandleContainer.prototype.onhandleattach = function(sourcePort, targetPort, context) {
      context.wireHandle.visible(false);
    };

    WireHandleContainer.prototype.onhandledetach = function(sourcePort, targetPort, context) {
      context.wireHandle.visible(true);
    };

    return WireHandleContainer;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainContent;
  } else {
    app.MainContent = MainContent;
  }
})(this.app || (this.app = {}));
