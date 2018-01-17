(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitModule = app.CircuitModule || require('../models/circuit-module.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');
  var Module = app.Module || require('./module.js');
  var Wire = app.Wire || require('./wire.js');

  var MainContent = jCore.Component.inherits(function(props) {
    this.lockRelations = [];
    this.moduleContainer = new MainContent.ModuleContainer({ element: this.findElement('.module-container') });
  });

  MainContent.prototype.wireContainerElement = function() {
    return this.findElement('.wire-container');
  };

  MainContent.prototype.offsetLeft = function() {
    return dom.offsetLeft(this.element())
  };

  MainContent.prototype.offsetTop = function() {
    return dom.offsetTop(this.element());
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

  MainContent.prototype.toData = function() {
    return this.moduleContainer.toData();
  };

  MainContent.prototype.load = function(data) {
    return this.moduleContainer.load(data);
  };

  MainContent.prototype.clear = function() {
    this.moduleContainer.clear();
  };

  MainContent.prototype.createWire = function(sourcePort, targetPort) {
    return new Wire({
      sourceX: sourcePort.plugX(),
      sourceY: sourcePort.plugY(),
      targetX: (targetPort ? targetPort.socketX() : sourcePort.plugX()),
      targetY: (targetPort ? targetPort.socketY() : sourcePort.plugY()),
      handleType: sourcePort.type(),
      handleVisible: !targetPort,
      parentHandleElement: this.findElement('.wire-handle-container'),
    });
  };

  MainContent.prototype.loadModule = function(props, visiblePortNames) {
    return this.moduleContainer.loadModule(props, visiblePortNames);
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

  MainContent.prototype.connect = function(sourcePort, targetPort) {
    var wire = this.createWire(sourcePort, targetPort);
    wire.parentElement(this.wireContainerElement());
    this.lock(LockRelation.TYPE_PLUG, sourcePort, wire);
    this.lock(LockRelation.TYPE_SOCKET, targetPort, wire);
    wire.highlighted(sourcePort.plugHighlighted());
  };

  MainContent.prototype.disconnect = function(sourcePort, targetPort) {
    var wire = this.attachedWire(targetPort);
    wire.parentElement(null);
    this.unlock(LockRelation.TYPE_PLUG, sourcePort, wire);
    this.unlock(LockRelation.TYPE_SOCKET, targetPort, wire);
  };

  MainContent.prototype.portEventHighlighted = function(sourcePort, highlighted) {
    sourcePort.plugHighlighted(highlighted);
    this.moduleContainer.portEventHighlighted(sourcePort, highlighted)
    this.lockedWires(LockRelation.TYPE_PLUG, sourcePort).forEach(function(wire) {
      wire.highlighted(highlighted);
    });
  };

  MainContent.prototype.keepDraggingWire = function(sourcePort, targetPort, wire) {
    sourcePort.decrementHighlightCount();
    targetPort.decrementHighlightCount();
  };

  MainContent.prototype.removeDraggingWire = function(sourcePort, wire) {
    sourcePort.decrementHighlightCount();
    this.unlock(LockRelation.TYPE_PLUG, sourcePort, wire);
  };

  MainContent.prototype.oninit = function() {
    dom.on(this.element(), dom.eventType('start'), this.onpoint.bind(this));
    this.moduleContainer.on('connect', this.onconnect.bind(this));
    this.moduleContainer.on('disconnect', this.ondisconnect.bind(this));
    this.moduleContainer.on('portevent', this.onportevent.bind(this));
    this.moduleContainer.on('dragstart', this.emit.bind(this, 'dragstart'));
    this.moduleContainer.on('dragend', this.emit.bind(this, 'dragend'));
    this.moduleContainer.on('handlestart', this.onhandlestart.bind(this));
    this.moduleContainer.on('handlemove', this.onhandlemove.bind(this));
    this.moduleContainer.on('handleattach', this.onhandleattach.bind(this));
    this.moduleContainer.on('handledetach', this.onhandledetach.bind(this));
    this.moduleContainer.on('plugdragend', this.onplugdragend.bind(this));
    this.moduleContainer.on('socketdragend', this.onsocketdragend.bind(this));
  };

  MainContent.prototype.onpoint = function(event) {
    // remove keyboard focus when pointing background
    if (dom.target(event) === this.element()) {
      dom.removeFocus();
    }
  };

  MainContent.prototype.onconnect = function(sourcePort, targetPort) {
    this.connect(sourcePort, targetPort);
  };

  MainContent.prototype.ondisconnect = function(sourcePort, targetPort) {
    this.disconnect(sourcePort, targetPort);
  };

  MainContent.prototype.onportevent = function(sourcePort) {
    this.portEventHighlighted(sourcePort, true);
    setTimeout(this.portEventHighlighted.bind(this), 100, sourcePort, false);
  };

  MainContent.prototype.onhandlestart = function(sourcePort, targetPort, context) {
    context.wire = (targetPort ? this.attachedWire(targetPort) : this.createWire(sourcePort, null));
    if (!targetPort) {
      context.wire.parentElement(this.wireContainerElement());
      this.lock(LockRelation.TYPE_PLUG, sourcePort, context.wire);
      context.wire.highlighted(sourcePort.plugHighlighted());
    }
  };

  MainContent.prototype.onhandlemove = function(sourcePort, targetPort, context, x, y) {
    context.wire.targetX(x);
    context.wire.targetY(y);
  };

  MainContent.prototype.onhandleattach = function(sourcePort, targetPort, context) {
    context.wire.handleVisible(false);
    this.lock(LockRelation.TYPE_SOCKET, targetPort, context.wire);
  };

  MainContent.prototype.onhandledetach = function(sourcePort, targetPort, context) {
    context.wire.handleVisible(true);
    this.unlock(LockRelation.TYPE_SOCKET, targetPort, context.wire);
  };

  MainContent.prototype.onplugdragend = function(sourcePort, context) {
    if (context.targetPort) {
      this.keepDraggingWire(sourcePort, context.targetPort, context.wire);
    } else {
      this.removeDraggingWire(sourcePort, context.wire);
      context.wire.parentElement(null);
    }
  };

  MainContent.prototype.onsocketdragend = function(targetPort, context) {
    this.onplugdragend(context.sourcePort, context);
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
      module.on('plugdragend', this.emit.bind(this, 'plugdragend'));
      module.on('socketdragstart', this.onsocketdragstart.bind(this));
      module.on('socketdragmove', this.onsocketdragmove.bind(this));
      module.on('socketdragend', this.emit.bind(this, 'socketdragend'));
      return module;
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

    ModuleContainer.prototype.loadModule = function(props, visiblePortNames) {
      var module = this.createModule(props);
      module.parentElement(this.element());
      this.modules.push(module);
      this.refresh();
      return module.load(visiblePortNames);
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

    ModuleContainer.prototype.connectedSourcePort = function(targetPort) {
      // socket of the target port can only be connected to one source port
      var binding = helper.find(this.bindings, function(binding) {
        return (binding.targetPort === targetPort);
      });
      return binding.sourcePort;
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
      this.emit('handlestart', sourcePort, targetPort, context);
    };

    ModuleContainer.prototype.handlemove = function(sourcePort, targetPort, context, x, y) {
      var port = this.portFromSocketPosition(x, y);

      if (port && targetPort && port === targetPort) {
        // fix the position of the dragging handle
        return;
      }

      this.emit('handlemove', sourcePort, targetPort, context, x, y);

      if (targetPort) {
        this.handledetach(sourcePort, targetPort, context);
      }

      targetPort = (this.canConnect(sourcePort, port) ? port : null);
      if (targetPort) {
        this.handleattach(sourcePort, targetPort, context);
      }

      context.targetPort = targetPort;
    };

    ModuleContainer.prototype.handleattach = function(sourcePort, targetPort, context) {
      this.attach(sourcePort, targetPort);
      targetPort.incrementHighlightCount();
      this.emit('handleattach', sourcePort, targetPort, context);
    };

    ModuleContainer.prototype.handledetach = function(sourcePort, targetPort, context) {
      this.detach(sourcePort, targetPort);
      targetPort.decrementHighlightCount();
      this.emit('handledetach', sourcePort, targetPort, context);
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

    ModuleContainer.prototype.onplugdragstart = function(sourcePort, context) {
      context.x = sourcePort.plugX();
      context.y = sourcePort.plugY();
      context.targetPort = null;
      this.handlestart(sourcePort, context.targetPort, context);
    };

    ModuleContainer.prototype.onplugdragmove = function(sourcePort, context, dx, dy) {
      this.handlemove(sourcePort, context.targetPort, context, context.x + dx, context.y + dy);
    };

    ModuleContainer.prototype.onsocketdragstart = function(targetPort, context) {
      context.x = targetPort.socketX();
      context.y = targetPort.socketY();
      context.sourcePort = this.connectedSourcePort(targetPort);
      context.targetPort = targetPort;
      this.handlestart(context.sourcePort, context.targetPort, context);
    };

    ModuleContainer.prototype.onsocketdragmove = function(targetPort, context, dx, dy) {
      this.handlemove(context.sourcePort, context.targetPort, context, context.x + dx, context.y + dy);
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainContent;
  } else {
    app.MainContent = MainContent;
  }
})(this.app || (this.app = {}));
