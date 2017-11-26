(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitModule = app.CircuitModule || require('../models/circuit-module.js');
  var Component = app.Component || require('./component.js');
  var ModulePort = app.ModulePort || require('./module-port.js');

  var Module = Component.inherits(function(props) {
    this.title = this.prop(props.title);
    this.name = this.prop(props.name);
    this.x = this.prop(props.x);
    this.y = this.prop(props.y);
    this.zIndex = this.prop('auto');
    this.deletable = this.prop(true);
    this.ports = this.prop([]);
    this.portListTop = this.prop(0);
    this.circuitModule = this.prop(null);
    this.eventCircuitModule = this.prop(null);
    this.isLoading = this.prop(false);
    this.isError = this.prop(false);
    this.isMoving = this.prop(false);
    this.isDeleting = this.prop(false);
    this.headerHeight = this.prop(32);
    this.portList = new Module.PortList({ element: this.childElement('.module-port-list') });
    this.portSelect = new Module.PortSelect({ element: this.childElement('.module-port-select') });
    this.draggable = new Module.Draggable({ component: this });
    this.onpoint = this.emit.bind(this, 'point', this);
  });

  Module.prototype.componentElement = function() {
    return this.childElement('.module-component');
  };

  Module.prototype.componentContentWindow = function() {
    return dom.contentWindow(this.componentElement());
  };

  Module.prototype.circuitModuleMember = function(name) {
    var circuitModule = this.circuitModule();
    return (circuitModule ? circuitModule.get(name) : null);
  };

  Module.prototype.bottomRightX = function() {
    return this.x() + dom.rect(this.element()).width + this.rightPadding();
  };

  Module.prototype.bottomRightY = function() {
    return this.y() + dom.rect(this.element()).height;
  };

  Module.prototype.rightPadding = function() {
    return this.visiblePorts().map(function(port) {
      return (port.plugDisabled() ? 0 : port.plugWidth());
    }).reduce(function(prev, curr) {
      return Math.max(prev, curr);
    }, 0);
  };

  Module.prototype.leftPadding = function() {
    return this.visiblePorts().map(function(port) {
      return (port.socketDisabled() ? 0 : port.socketWidth());
    }).reduce(function(prev, curr) {
      return Math.max(prev, curr);
    }, 0);
  };

  Module.prototype.portOffsetX = function() {
    return this.x();
  };

  Module.prototype.portOffsetY = function() {
    return this.y() + this.portListTop();
  };

  Module.prototype.port = function(name) {
    return helper.find(this.ports(), function(port) {
      return (port.name() === name);
    });
  };

  Module.prototype.targetPort = function(target) {
    return helper.find(this.ports(), function(port) {
      return dom.contains(port.element(), target);
    });
  };

  Module.prototype.eventPorts = function() {
    return this.ports().filter(function(port) {
      return (port.type() === ModulePort.TYPE_EVENT);
    });
  };

  Module.prototype.visiblePorts = function() {
    return this.portList.ports.slice();
  };

  Module.prototype.footerDisabled = function() {
    // disable footer when all ports are visible
    return (this.visiblePorts().length === this.ports().length);
  };

  Module.prototype.hasHighlightedPort = function() {
    return this.ports().some(function(port) {
      return port.highlighted();
    })
  };

  Module.prototype.portFromSocketPosition = function(x, y) {
    var ports = this.ports();

    if (ports.length === 0) {
      return null;
    }

    // all ports are at the same position to the x-axis
    if (Math.abs(x - ports[0].socketX()) > 18) {
      return null;
    }

    return helper.findLast(ports, function(port) {
      return (Math.abs(y - port.socketY()) <= 18 && port.visible() && !port.socketDisabled());
    }.bind(this));
  };

  Module.prototype.url = function() {
    return 'modular_modules/' + helper.encodePath(this.name()) + '.html';
  };

  Module.prototype.props = function() {
    return {
      title: this.title(),
      name: this.name(),
      x: this.x(),
      y: this.y(),
    };
  };

  Module.prototype.visiblePortNames = function() {
    return this.visiblePorts().sort(function(a, b) {
      return a.top() - b.top();
    }).map(function(port) {
      return port.name();
    });
  };

  Module.prototype.dragListener = function(target) {
    var entry = helper.find(Module.DRAG_LISTENER_ENTRIES, function(entry) {
      return dom.hasClass(target, entry.className);
    });
    return (entry ? entry.listener : null);
  };

  Module.prototype.createPorts = function() {
    return this.circuitModule().getAll().map(function(member) {
      return new ModulePort(helper.extend({
        offsetX: this.portOffsetX(),
        offsetY: this.portOffsetY(),
      }, member));
    }.bind(this));
  };

  Module.prototype.createEventCircuitModule = function() {
    return new CircuitModule.ModularModule(this.eventPorts().map(function(port) {
      return {
        label: port.label(),
        name: port.name(),
        type: port.type(),
        arg: this.emit.bind(this, 'portevent', port),
      };
    }.bind(this)));
  };

  Module.prototype.bindEventCircuitModule = function() {
    var circuitModule = this.circuitModule();
    var eventCircuitModule = this.eventCircuitModule();
    if (!circuitModule || !eventCircuitModule) {
      return;
    }

    eventCircuitModule.getAll().forEach(function(member) {
      CircuitModule.bind(circuitModule.get(member.name), member);
    });
  };

  Module.prototype.unbindEventCircuitModule = function() {
    var circuitModule = this.circuitModule();
    var eventCircuitModule = this.eventCircuitModule();
    if (!circuitModule || !eventCircuitModule) {
      return;
    }

    eventCircuitModule.getAll().forEach(function(member) {
      CircuitModule.unbind(circuitModule.get(member.name), member);
    });
  };

  Module.prototype.registerComponentPointListener = function() {
    dom.on(this.componentContentWindow(), dom.eventType('start'), this.onpoint, true);
  };

  Module.prototype.unregisterComponentPointListener = function() {
    dom.off(this.componentContentWindow(), dom.eventType('start'), this.onpoint, true);
  };

  Module.prototype.registerPointListener = function() {
    dom.on(this.element(), dom.eventType('start'), this.onpoint, true);
  };

  Module.prototype.unregisterPointListener = function() {
    dom.off(this.element(), dom.eventType('start'), this.onpoint, true);
  };

  Module.prototype.setComponentContent = function(contentText) {
    dom.writeContent(this.componentElement(), contentText);
  };

  Module.prototype.registerComponentLoadListener = function(resolve, reject) {
    dom.once(this.componentContentWindow(), 'load', function() {
      resolve();
    });
  };

  Module.prototype.resetComponentHeight = function() {
    dom.fillContentHeight(this.componentElement());
    this.portListTop(this.headerHeight() + dom.rect(this.componentElement()).height + 1);
  };

  Module.prototype.resetPortSelect = function() {
    this.ports().forEach(function(port) {
      this.portSelect.add(port);
    }.bind(this));
  };

  Module.prototype.loadCircuitModule = function() {
    var circuitModule = helper.dig(this.componentContentWindow(), 'modular', 'exports');
    if (!circuitModule) {
      throw new Error('Invalid circuit element');
    }
    return circuitModule;
  };

  Module.prototype.loadComponent = function() {
    this.isLoading(true);
    return dom.ajax({
      type: 'GET',
      url: this.url(),
    }).then(function(text) {
      this.setComponentContent(text);
      return Promise.race([
        new Promise(this.registerComponentLoadListener.bind(this)),
        new Promise(function(resolve, reject) {
          setTimeout(reject, 30 * 1000, new Error('Load timeout for content'));
        }),
      ]);
    }.bind(this)).then(function() {
      this.resetComponentHeight();
      this.circuitModule(this.loadCircuitModule());
      this.ports(this.createPorts());
      this.resetPortSelect();
      this.eventCircuitModule(this.createEventCircuitModule());
      this.bindEventCircuitModule();
      this.registerComponentPointListener();
      this.isLoading(false);
    }.bind(this)).catch(function(e) {
      this.isError(true);
      throw e;
    }.bind(this));
  };

  Module.prototype.moveX = function(value) {
    this.x(Math.max(value, this.leftPadding()));

    this.visiblePorts().forEach(function(port) {
      port.offsetX(this.portOffsetX());
    }.bind(this));
  };

  Module.prototype.moveY = function(value) {
    this.y(Math.max(value, 0));

    this.visiblePorts().forEach(function(port) {
      port.offsetY(this.portOffsetY());
    }.bind(this));
  };

  Module.prototype.showPort = function(name) {
    var port = this.port(name);

    if (!port || port.visible()) {
      return;
    }

    port.offsetX(this.portOffsetX());
    port.offsetY(this.portOffsetY());

    this.portList.add(port);
    this.portSelect.remove(port);

    // move right not to position the port-socket outside
    this.moveX(this.x());

    this.markDirty();
    this.emit('porttoggle', port);
  };

  Module.prototype.hidePort = function(name) {
    var port = this.port(name);

    if (!port || !port.visible()) {
      return;
    }

    this.portList.remove(port);
    this.portSelect.add(port);
    this.markDirty();
    this.emit('porttoggle', port);
  };

  Module.prototype.hideAllPorts = function() {
    this.ports().forEach(function(port) {
      this.hidePort(port.name());
    }.bind(this));
  };

  Module.prototype.delete = function() {
    // remove all connections of connected ports
    this.hideAllPorts();

    this.parentElement(null);
    this.emit('delete', this);
  };

  Module.prototype.render = function() {
    return dom.render(Module.HTML_TEXT);
  };

  Module.prototype.oninit = function() {
    this.portSelect.on('select', this.onselect.bind(this));
    this.addRelation(new Module.Relation({
      module: this,
      title: new Module.Title({ element: this.childElement('.module-title') }),
      deleteButton: new Module.DeleteButton({ element: this.childElement('.module-delete-button') }),
      footer: new Module.Footer({ element: this.childElement('.module-footer') }),
    }));
  };

  Module.prototype.onappend = function() {
    this.draggable.enable();
    this.portSelect.onappend();
    this.registerPointListener();
  };

  Module.prototype.onremove = function() {
    this.draggable.disable();
    this.portSelect.onremove();
    this.unregisterPointListener();
    this.unbindEventCircuitModule();
    this.unregisterComponentPointListener();
  };

  Module.prototype.onredraw = function() {
    this.redrawBy('x', 'y', function(x, y) {
      dom.translate(this.element(), x, y);
    });

    this.redrawBy('zIndex', function(zIndex) {
      dom.css(this.element(), { zIndex: zIndex });
    });

    this.redrawBy('isLoading', function(isLoading) {
      dom.toggleClass(this.element(), 'loading', isLoading);
    });

    this.redrawBy('isError', function(isError) {
      dom.toggleClass(this.element(), 'error', isError);
    });

    this.redrawBy('isMoving', function(isMoving) {
      dom.toggleClass(this.element(), 'moving', isMoving);
    });

    this.redrawBy('isDeleting', function(isDeleting) {
      dom.toggleClass(this.element(), 'deleting', isDeleting);
    });
  };

  Module.prototype.onselect = function(name) {
    this.showPort(name);
  };

  Module.DRAG_LISTENER_POSITION = {
    onstart: function(module, x, y, event, context) {
      context.x = module.x();
      context.y = module.y();
      module.isMoving(true);
    },
    onmove: function(module, dx, dy, event, context) {
      module.moveX(context.x + dx);
      module.moveY(context.y + dy);
    },
    onend: function(module, dx, dy, event, context) {
      module.isMoving(false);
    },
  };

  Module.DRAG_LISTENER_DELETE = {
    onstart: function(module, x, y, event, context) {
      context.target = dom.target(event);
      module.isDeleting(true);
    },
    onmove: function(module, dx, dy, event, context) {
      module.isDeleting(dom.target(event) === context.target);
    },
    onend: function(module, dx, dy, event, context) {
      module.isDeleting(false);
      if (dom.target(event) === context.target) {
        module.delete();
      }
    },
  };

  Module.DRAG_LISTENER_HIDE_PORT = {
    onstart: function(module, x, y, event, context) {
      context.target = dom.target(event);
    },
    onmove: function() { /* do nothing */ },
    onend: function(module, dx, dy, event, context) {
      if (dom.target(event) === context.target) {
        var name = module.targetPort(context.target).name();
        module.hidePort(name);
      }
    },
  };

  Module.DRAG_LISTENER_SORT_PORT = {
    onstart: function(module, x, y, event, context) {
      var port = module.targetPort(dom.target(event));
      var top = port.top();
      context.port = port;
      context.top = top;
      context.placeholderTop = top;
      port.isMoving(true);
    },
    onmove: function(module, dx, dy, event, context) {
      var targetPort = context.port;

      // move the target port within the port list
      targetPort.top(helper.clamp(context.top + dy, 0, module.portList.height() - targetPort.height()));

      if (targetPort.top() - context.placeholderTop > 0) {
        this.onmovedown(module, dx, dy, event, context);
      } else {
        this.onmoveup(module, dx, dy, event, context);
      }
    },
    onmovedown: function(module, dx, dy, event, context) {
      var targetPort = context.port;
      var targetPortHeight = targetPort.height();
      var targetPortMiddle = targetPort.middle();
      var placeholderTop = context.placeholderTop;

      // move up the ports over the target port
      module.visiblePorts().filter(function(port) {
        var top = port.top();
        return (port !== targetPort && placeholderTop <= top && top < targetPortMiddle);
      }).forEach(function(port) {
        port.top(port.top() - targetPortHeight);
        placeholderTop = Math.max(placeholderTop, port.bottom());
      });

      context.placeholderTop = placeholderTop;
    },
    onmoveup: function(module, dx, dy, event, context) {
      var targetPort = context.port;
      var targetPortHeight = targetPort.height();
      var targetPortMiddle = targetPort.middle();
      var placeholderTop = context.placeholderTop;

      // move down the ports under the target port
      module.visiblePorts().filter(function(port) {
        var bottom = port.bottom();
        return (port !== targetPort && targetPortMiddle < bottom && bottom <= placeholderTop);
      }).forEach(function(port) {
        var top = port.top();
        port.top(top + targetPortHeight);
        placeholderTop = Math.min(placeholderTop, top);
      });

      context.placeholderTop = placeholderTop;
    },
    onend: function(module, dx, dy, event, context) {
      var port = context.port;
      port.top(context.placeholderTop);
      port.isMoving(false);
    },
  };

  Module.DRAG_LISTENER_DRAG_PORT_PLAG = {
    onstart: function(module, x, y, event, context) {
      context.port = module.targetPort(dom.target(event));
      context.context = {};
      module.emit('plugdragstart', context.port, context.context);
    },
    onmove: function(module, dx, dy, event, context) {
      module.emit('plugdragmove', context.port, dx, dy, context.context);
    },
    onend: function(module, dx, dy, event, context) {
      module.emit('plugdragend', context.port, context.context);
    },
  };

  Module.DRAG_LISTENER_DRAG_PORT_SOCKET = {
    onstart: function(module, x, y, event, context) {
      context.port = module.targetPort(dom.target(event));
      context.context = {};
      module.emit('socketdragstart', context.port, context.context);
    },
    onmove: function(module, dx, dy, event, context) {
      module.emit('socketdragmove', context.port, dx, dy, context.context);
    },
    onend: function(module, dx, dy, event, context) {
      module.emit('socketdragend', context.port, context.context);
    },
  };

  Module.DRAG_LISTENER_ENTRIES = [
    { className: 'module-title', listener: Module.DRAG_LISTENER_POSITION },
    { className: 'module-delete-button', listener: Module.DRAG_LISTENER_DELETE },
    { className: 'module-port-hide-button', listener: Module.DRAG_LISTENER_HIDE_PORT },
    { className: 'module-port-content', listener: Module.DRAG_LISTENER_SORT_PORT },
    { className: 'module-port-plug', listener: Module.DRAG_LISTENER_DRAG_PORT_PLAG },
    { className: 'module-port-socket-handle', listener: Module.DRAG_LISTENER_DRAG_PORT_SOCKET },
  ];

  Module.HTML_TEXT = [
    '<div class="module">',
      '<div class="module-header">',
        '<div class="module-title module-header-item"></div>',
        '<div class="module-delete-button module-header-item"></div>',
      '</div>',
      '<div class="module-content">',
        '<iframe class="module-component module-content-item embed"></iframe>',
        '<div class="module-port-list module-content-item"></div>',
      '</div>',
      '<div class="module-footer">',
        '<img class="module-footer-icon module-footer-item" src="images/caret-down.svg">',
        '<select class="module-port-select module-footer-item">',
          '<optgroup data-type="prop" label="Property"></optgroup>',
          '<optgroup data-type="event" label="Event"></optgroup>',
        '</select>',
      '</div>',
    '</div>',
  ].join('');

  Module.Title = (function() {
    var Title = Component.inherits(function() {
      this.text = this.prop('');
    });

    Title.prototype.onredraw = function() {
      this.redrawBy('text', function(text) {
        dom.text(this.element(), text);
      });
    };

    return Title;
  })();

  Module.DeleteButton = (function() {
    var DeleteButton = Component.inherits(function() {
      this.disabled = this.prop(false);
    });

    DeleteButton.prototype.onredraw = function() {
      this.redrawBy('disabled', function(disabled) {
        dom.toggleClass(this.element(), 'disabled', disabled);
      });
    };

    return DeleteButton;
  })();

  Module.PortList = (function() {
    var PortList = Component.inherits(function() {
      this.ports = [];
    });

    PortList.prototype.height = function() {
      return this.ports.reduce(function(prev, curr) {
        return prev + curr.height();
      }, 0);
    };

    PortList.prototype.add = function(port) {
      // add the port to the end of the list
      port.top(this.height());
      port.parentElement(this.element());
      this.ports.push(port);
      this.markDirty();
    };

    PortList.prototype.remove = function(port) {
      helper.remove(this.ports, port);
      port.parentElement(null);

      // move up the ports below the removed port
      this.ports.forEach(function(listedPort) {
        if (listedPort.top() > port.top()) {
          listedPort.top(listedPort.top() - port.height());
        }
      });

      this.markDirty();
    };

    PortList.prototype.onredraw = function() {
      this.redrawBy('height', function(height) {
        dom.css(this.element(), { height: height + 'px' });
      });
    };

    return PortList;
  })();

  Module.Footer = (function() {
    var Footer = Component.inherits(function() {
      this.disabled = this.prop(false);
    });

    Footer.prototype.onredraw = function() {
      this.redrawBy('disabled', function(disabled) {
        dom.toggleClass(this.element(), 'hide', disabled);
      });
    };

    return Footer;
  })();

  Module.PortSelect = (function() {
    var PortSelect = Component.inherits(function(props) {
      this.ports = [];
      this.options = [];
      this.onchange = this.onchange.bind(this);
    });

    PortSelect.prototype.optGroupElement = function(type) {
      return this.childElement('optgroup[data-type="' + type + '"]');
    };

    PortSelect.prototype.add = function(port) {
      this.ports.push(port);
      this.markDirty();
    };

    PortSelect.prototype.remove = function(port) {
      helper.remove(this.ports, port);
      this.markDirty();
    };

    PortSelect.prototype.createOption = function(port) {
      return new PortSelect.Option({
        label: port.label(),
        name: port.name(),
      });
    };

    PortSelect.prototype.onappend = function() {
      dom.on(this.element(), 'change', this.onchange);
    };

    PortSelect.prototype.onremove = function() {
      dom.off(this.element(), 'change', this.onchange);
    };

    PortSelect.prototype.onredraw = function() {
      // remove all options
      this.options.forEach(function(option) {
        option.parentElement(null);
        option.redraw();
      });

      // sort options by label
      this.options = helper.sortBy(this.ports, function(port) {
        return port.label();
      }).map(function(port) {
        var option = this.createOption(port);
        option.parentElement(this.optGroupElement(port.type()));
        option.redraw();
        return option;
      }.bind(this));

      // deselect option
      dom.value(this.element(), '');
    };

    PortSelect.prototype.onchange = function(event) {
      dom.removeFocus();
      this.emit('select', dom.value(dom.target(event)));
    };

    PortSelect.Option = (function() {
      var Option = Component.inherits(function(props) {
        this.label = this.prop(props.label);
        this.name = this.prop(props.name);
      });

      Option.prototype.render = function() {
        return dom.render(Option.HTML_TEXT);
      };

      Option.prototype.onredraw = function() {
        this.redrawBy('label', function(label) {
          dom.text(this.element(), label);
        });

        this.redrawBy('name', function(name) {
          dom.value(this.element(), name);
        });
      };

      Option.HTML_TEXT = '<option></option>';

      return Option;
    })();

    return PortSelect;
  })();

  Module.Relation = (function() {
    var Relation = helper.inherits(function(props) {
      this.module = props.module;
      this.title = props.title;
      this.deleteButton = props.deleteButton;
      this.footer = props.footer;
    }, jCore.Relation);

    Relation.prototype.update = function() {
      this.updateTitle();
      this.updateDeleteButton();
      this.updateFooter();
    };

    Relation.prototype.updateTitle = function() {
      this.title.text(this.module.title());
    };

    Relation.prototype.updateDeleteButton = function() {
      this.deleteButton.disabled(!this.module.deletable());
    };

    Relation.prototype.updateFooter = function() {
      this.footer.disabled(this.module.footerDisabled());
    };

    return Relation;
  })();

  Module.Draggable = (function() {
    var Draggable = Component.Draggable.inherits();

    Draggable.prototype.onstart = function(module, x, y, event, context) {
      context.listener = module.dragListener(dom.target(event));
      if (!context.listener) {
        return;
      }

      dom.cancel(event);
      context.listener.onstart(module, x, y, event, context);
      module.emit('dragstart');
    };

    Draggable.prototype.onmove = function(module, dx, dy, event, context) {
      if (!context.listener) {
        return;
      }

      context.listener.onmove(module, dx, dy, event, context);
    };

    Draggable.prototype.onend = function(module, dx, dy, event, context) {
      if (!context.listener) {
        return;
      }

      context.listener.onend(module, dx, dy, event, context);
      module.emit('dragend');
    };

    return Draggable;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Module;
  } else {
    app.Module = Module;
  }
})(this.app || (this.app = {}));
