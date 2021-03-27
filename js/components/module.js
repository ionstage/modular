(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitModule = app.CircuitModule || require('../models/circuit-module.js');
  var ModulePort = app.ModulePort || require('./module-port.js');

  var Module = jCore.Component.inherits(function(_, props) {
    this.title = this.prop(props.title);
    this.name = this.prop(props.name);
    this.x = this.prop(props.x);
    this.y = this.prop(props.y);
    this.width = this.prop(240);
    this.zIndex = this.prop('auto');
    this.isLoading = this.prop(false);
    this.isError = this.prop(false);
    this.isMoving = this.prop(false);
    this.isDeleting = this.prop(false);
    this.ports = [];
    this.header = new Module.Header(dom.find(this.el, '.module-header'));
    this.footer = new Module.Footer(dom.find(this.el, '.module-footer'));
    this.component = new Module.Component(dom.find(this.el, '.module-component'));
    this.portList = new Module.PortList(dom.find(this.el, '.module-port-list'));
    this.portSelect = new Module.PortSelect(dom.find(this.el, '.module-port-select'));
    this.draggable = new Module.Draggable(this);
  });

  Module.prototype.height = function() {
    return this.header.height() + this.footer.height() + this.component.outerHeight() + this.portList.height();
  };

  Module.prototype.bottomRightX = function() {
    return this.x() + this.width() + this.rightPadding();
  };

  Module.prototype.bottomRightY = function() {
    return this.y() + this.height();
  };

  Module.prototype.portOffsetX = function() {
    return this.x();
  };

  Module.prototype.portOffsetY = function() {
    return this.y() + this.header.height() + this.component.outerHeight();
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

  Module.prototype.port = function(name) {
    return helper.find(this.ports, function(port) {
      return (port.name() === name);
    });
  };

  Module.prototype.targetPort = function(target) {
    return helper.find(this.ports, function(port) {
      return dom.contains(port.el, target);
    });
  };

  Module.prototype.visiblePorts = function() {
    return this.portList.ports.slice();
  };

  Module.prototype.portFromSocketPosition = function(x, y) {
    if (this.ports.length === 0) {
      return null;
    }

    // all ports are at the same position to the x-axis
    if (Math.abs(x - this.ports[0].socketX()) > 18) {
      return null;
    }

    return helper.findLast(this.ports, function(port) {
      return (Math.abs(y - port.socketY()) <= 18 && port.visible() && !port.socketDisabled());
    }.bind(this));
  };

  Module.prototype.url = function() {
    return 'modular_modules/' + encodeURI(this.name()) + '.html';
  };

  Module.prototype.footerDisabled = function() {
    // disable footer when all ports are visible
    return (this.visiblePorts().length === this.ports.length);
  };

  Module.prototype.toData = function() {
    return {
      props: {
        title: this.title(),
        name: this.name(),
        x: this.x(),
        y: this.y(),
      },
      visiblePortNames: this.visiblePorts().sort(function(a, b) {
        return a.top() - b.top();
      }).map(function(port) {
        return port.name();
      }),
      serializedValue: this.component.serialize(),
    };
  };

  Module.prototype.createPort = function(props) {
    var port = new ModulePort(null, props);
    port.on('highlight', this.onporthighlight.bind(this));
    port.on('unhighlight', this.onportunhighlight.bind(this));
    return port;
  };

  Module.prototype.createPorts = function(members) {
    return members.map(function(member) {
      return this.createPort(helper.extend({
        offsetX: this.portOffsetX(),
        offsetY: this.portOffsetY(),
        member: member,
        module: this,
      }, member));
    }, this);
  };

  Module.prototype.setPorts = function(ports, visiblePortNames) {
    this.ports = ports;
    this.portSelect.set(ports);
    visiblePortNames.forEach(function(name) {
      this.showPort(name);
    }, this);
  };

  Module.prototype.removePortsAllListeners = function() {
    this.ports.forEach(function(port) {
      port.removeAllListeners();
    });
  };

  Module.prototype.load = function(visiblePortNames, serializedValue) {
    this.isLoading(true);
    this.redraw();
    return this.component.load(this.url()).then(function(component) {
      this.setPorts(this.createPorts(component.members), visiblePortNames);
      this.component.deserialize(serializedValue);
      this.isLoading(false);
      return this;
    }.bind(this)).catch(function(e) {
      this.isError(true);
      throw e;
    }.bind(this));
  };

  Module.prototype.moveX = function(value) {
    this.x(Math.max(value, this.leftPadding()));

    this.visiblePorts().forEach(function(port) {
      port.offsetX(this.portOffsetX());
    }, this);
  };

  Module.prototype.moveY = function(value) {
    this.y(Math.max(value, 0));

    this.visiblePorts().forEach(function(port) {
      port.offsetY(this.portOffsetY());
    }, this);
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
    this.footer.disabled(this.footerDisabled());

    // move right not to position the port-socket outside
    this.moveX(this.x());

    this.emit('portshow', port);
  };

  Module.prototype.hidePort = function(name) {
    var port = this.port(name);

    if (!port || !port.visible()) {
      return;
    }

    this.portList.remove(port);
    this.portSelect.add(port);
    this.footer.disabled(this.footerDisabled());
    this.emit('porthide', port);
  };

  Module.prototype.render = function() {
    return dom.render(Module.HTML_TEXT);
  };

  Module.prototype.oninit = function() {
    this.header.text(this.title());
  };

  Module.prototype.onappend = function() {
    this.draggable.enable();
    this.component.on('point', this.emit.bind(this, 'point', this));
    this.component.on('event', this.onportevent.bind(this));
    this.portSelect.on('point', this.emit.bind(this, 'point', this));
    this.portSelect.on('select', this.onselect.bind(this));
    this.portSelect.onappend();
  };

  Module.prototype.onremove = function() {
    this.removePortsAllListeners();
    this.draggable.disable();
    this.component.unload();
    this.component.removeAllListeners();
    this.portSelect.removeAllListeners();
    this.portSelect.onremove();
  };

  Module.prototype.onredraw = function() {
    this.redrawBy('x', 'y', function(x, y) {
      dom.translate(this.el, x, y);
    });

    this.redrawBy('zIndex', function(zIndex) {
      dom.css(this.el, { zIndex: zIndex });
    });

    this.redrawBy('isLoading', function(isLoading) {
      dom.toggleClass(this.el, 'loading', isLoading);
    });

    this.redrawBy('isError', function(isError) {
      dom.toggleClass(this.el, 'error', isError);
    });

    this.redrawBy('isMoving', function(isMoving) {
      dom.toggleClass(this.el, 'moving', isMoving);
    });

    this.redrawBy('isDeleting', function(isDeleting) {
      dom.toggleClass(this.el, 'deleting', isDeleting);
    });
  };

  Module.prototype.onportevent = function(member) {
    this.emit('portevent', this.port(member.name));
  };

  Module.prototype.onselect = function(name) {
    this.showPort(name);
  };

  Module.prototype.onporthighlight = function() {
    this.header.incrementDeletableCount();
  };

  Module.prototype.onportunhighlight = function() {
    this.header.decrementDeletableCount();
  };

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
        '<svg class="module-footer-icon module-footer-item" width="1792" height="1792" viewBox="0 0 1792 1792"><path d="M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z" fill="#fff"/></svg>',
        '<select class="module-port-select module-footer-item">',
          '<optgroup data-type="data" label="Data"></optgroup>',
          '<optgroup data-type="event" label="Event"></optgroup>',
        '</select>',
      '</div>',
    '</div>',
  ].join('');

  Module.Header = (function() {
    var Header = jCore.Component.inherits(function() {
      this.text = this.prop('');
      this.deletableCount = this.prop(0);
      this.height = this.prop(32);
    });

    Header.prototype.titleElement = function() {
      return dom.find(this.el, '.module-title');
    };

    Header.prototype.deleteButtonElement = function() {
      return dom.find(this.el, '.module-delete-button');
    };

    Header.prototype.deleteButtonDisabled = function() {
      return (this.deletableCount() !== 0);
    };

    Header.prototype.incrementDeletableCount = function() {
      this.deletableCount(this.deletableCount() + 1);
    };

    Header.prototype.decrementDeletableCount = function() {
      this.deletableCount(this.deletableCount() - 1);
    };

    Header.prototype.onredraw = function() {
      this.redrawBy('text', function(text) {
        dom.text(this.titleElement(), text);
      });

      this.redrawBy('deleteButtonDisabled', function(deleteButtonDisabled) {
        dom.toggleClass(this.deleteButtonElement(), 'disabled', deleteButtonDisabled);
      });
    };

    return Header;
  })();

  Module.Footer = (function() {
    var Footer = jCore.Component.inherits(function() {
      this.disabled = this.prop(false);
    });

    Footer.prototype.height = function() {
      return (this.disabled() ? 0 : 21);
    };

    Footer.prototype.onredraw = function() {
      this.redrawBy('disabled', function(disabled) {
        dom.toggleClass(this.el, 'hide', disabled);
      });
    };

    return Footer;
  })();

  Module.Component = (function() {
    var Component = jCore.Component.inherits(function() {
      this.height = this.prop(0);
      this.members = [];
      this.eventMembers = [];
      this.options = this.createDefaultOptions();
      this.onpoint = this.emit.bind(this, 'point');
    });

    Component.prototype.outerHeight = function() {
      return this.height() + 1;
    };

    Component.prototype.contentWindow = function() {
      return dom.contentWindow(this.el);
    };

    Component.prototype.circuitModule = function() {
      var modular = this.contentWindow().modular;
      return (modular && modular.exports);
    };

    Component.prototype.member = function(name) {
      return helper.findLast(this.members, function(member) {
        return (member.name === name);
      });
    };

    Component.prototype.createEventCircuitModule = function() {
      return new CircuitModule.ModularModule(this.members.filter(function(member) {
        return (member.type === 'event');
      }).map(function(member) {
        return helper.extend({ arg: this.emit.bind(this, 'event', member) }, member);
      }, this));
    };

    Component.prototype.bindEventMembers = function() {
      this.eventMembers.forEach(function(member) {
        CircuitModule.bind(this.member(member.name), member);
      }, this);
    };

    Component.prototype.unbindEventMembers = function() {
      this.eventMembers.forEach(function(member) {
        CircuitModule.unbind(this.member(member.name), member);
      }, this);
    };

    Component.prototype.createDefaultOptions = function() {
      return {
        serialize: function() { return null; },
        deserialize: function() { /* do nothing */ },
      };
    };

    Component.prototype.serialize = function() {
      var s = this.options.serialize();
      return (s != null ? String(s) : null);
    };

    Component.prototype.deserialize = function(s) {
      if (s != null) {
        this.options.deserialize(String(s));
      }
    };

    Component.prototype.load = function(url) {
      return new Promise(function(resolve, reject) {
        var timeoutID = setTimeout(reject, 30 * 1000, new Error('Load timeout for content'));
        dom.once(this.el, 'load', function() {
          clearTimeout(timeoutID);
          resolve(this.circuitModule());
        }.bind(this));
        dom.attr(this.el, { src: url });
      }.bind(this)).then(function(circuitModule) {
        if (!circuitModule) {
          throw new Error('Invalid circuit module');
        }
        this.height(dom.contentHeight(this.el));
        dom.css(this.el, { height: this.height() + 'px' });
        dom.on(this.contentWindow(), dom.eventType('start'), this.onpoint, true);
        this.members = circuitModule.getAll();
        this.eventMembers = this.createEventCircuitModule().getAll();
        this.bindEventMembers();
        helper.extend(this.options, circuitModule.options);
        return this;
      }.bind(this));
    };

    Component.prototype.unload = function() {
      dom.off(this.contentWindow(), dom.eventType('start'), this.onpoint, true);
      this.unbindEventMembers();
    };

    return Component;
  })();

  Module.PortList = (function() {
    var PortList = jCore.Component.inherits(function() {
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
      port.parentElement(this.el);
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
        dom.css(this.el, { height: height + 'px' });
      });
    };

    return PortList;
  })();

  Module.PortSelect = (function() {
    var PortSelect = jCore.Component.inherits(function() {
      this.ports = [];
      this.options = [];
      this.onpoint = this.onpoint.bind(this);
      this.onchange = this.onchange.bind(this);
    });

    PortSelect.prototype.optGroupElement = function(type) {
      return dom.find(this.el, 'optgroup[data-type="' + type + '"]');
    };

    PortSelect.prototype.set = function(ports) {
      this.ports = ports.slice();
      this.markDirty();
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
      return new PortSelect.Option(null, {
        label: port.label(),
        name: port.name(),
      });
    };

    PortSelect.prototype.onappend = function() {
      dom.on(this.el, dom.eventType('start'), this.onpoint);
      dom.on(this.el, 'change', this.onchange);
    };

    PortSelect.prototype.onremove = function() {
      dom.off(this.el, dom.eventType('start'), this.onpoint);
      dom.off(this.el, 'change', this.onchange);
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
      }, this);

      // deselect option
      dom.value(this.el, '');
    };

    PortSelect.prototype.onpoint = function(event) {
      dom.stop(event);
      this.emit('point');
    };

    PortSelect.prototype.onchange = function(event) {
      dom.removeFocus();
      this.emit('select', dom.value(dom.target(event)));
    };

    PortSelect.Option = (function() {
      var Option = jCore.Component.inherits(function(_, props) {
        this.label = this.prop(props.label);
        this.name = this.prop(props.name);
      });

      Option.prototype.render = function() {
        return dom.render(Option.HTML_TEXT);
      };

      Option.prototype.onredraw = function() {
        this.redrawBy('label', function(label) {
          dom.text(this.el, label);
        });

        this.redrawBy('name', function(name) {
          dom.value(this.el, name);
        });
      };

      Option.HTML_TEXT = '<option></option>';

      return Option;
    })();

    return PortSelect;
  })();

  Module.Draggable = (function() {
    var Draggable = jCore.Draggable.inherits();

    Draggable.prototype.onstart = function(module, x, y, event, context) {
      module.emit('point', module);
      context.listeners = Draggable.listenersByTarget(dom.target(event));
      if (context.listeners) {
        dom.cancel(event);
        module.emit('dragstart');
        context.listeners.onstart(module, x, y, event, context);
      }
    };

    Draggable.prototype.onmove = function(module, dx, dy, event, context) {
      if (context.listeners) {
        context.listeners.onmove(module, dx, dy, event, context);
      }
    };

    Draggable.prototype.onend = function(module, dx, dy, event, context) {
      if (context.listeners) {
        module.emit('dragend');
        context.listeners.onend(module, dx, dy, event, context);
      }
    };

    Draggable.titleListeners = {
      onstart: function(module, x, y, event, context) {
        context.x = module.x();
        context.y = module.y();
        module.isMoving(true);
      },
      onmove: function(module, dx, dy, event, context) {
        module.moveX(context.x + dx);
        module.moveY(context.y + dy);
      },
      onend: function(module, dx, dy, event, context) { // eslint-disable-line no-unused-vars
        module.isMoving(false);
      },
    };

    Draggable.deleteButtonListeners = {
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
          module.emit('delete', module);
        }
      },
    };

    Draggable.portHideButtonListeners = {
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

    Draggable.portContentListeners = {
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

    Draggable.portPlugListeners = {
      onstart: function(module, x, y, event, context) {
        context.port = module.targetPort(dom.target(event));
        context.context = {};
        module.emit('plugdragstart', context.port, context.context);
      },
      onmove: function(module, dx, dy, event, context) {
        module.emit('plugdragmove', context.port, context.context, dx, dy);
      },
      onend: function(module, dx, dy, event, context) {
        module.emit('plugdragend', context.port, context.context);
      },
    };

    Draggable.portSocketHandleListeners = {
      onstart: function(module, x, y, event, context) {
        context.port = module.targetPort(dom.target(event));
        context.context = {};
        module.emit('socketdragstart', context.port, context.context);
      },
      onmove: function(module, dx, dy, event, context) {
        module.emit('socketdragmove', context.port, context.context, dx, dy);
      },
      onend: function(module, dx, dy, event, context) {
        module.emit('socketdragend', context.port, context.context);
      },
    };

    Draggable.listenersByTarget = (function() {
      var entries = [
        { className: 'module-title', listeners: Draggable.titleListeners },
        { className: 'module-delete-button', listeners: Draggable.deleteButtonListeners },
        { className: 'module-port-hide-button', listeners: Draggable.portHideButtonListeners },
        { className: 'module-port-content', listeners: Draggable.portContentListeners },
        { className: 'module-port-plug', listeners: Draggable.portPlugListeners },
        { className: 'module-port-socket-handle', listeners: Draggable.portSocketHandleListeners },
      ];
      return function(target) {
        var entry = helper.find(entries, function(entry) {
          return dom.hasClass(target, entry.className);
        });
        return (entry ? entry.listeners : null);
      };
    })();

    return Draggable;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Module;
  } else {
    app.Module = Module;
  }
})(this.app || (this.app = {}));
