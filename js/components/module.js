(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitElement = app.CircuitElement || require('../models/circuit-element.js');
  var Component = app.Component || require('./component.js');
  var ModulePort = app.ModulePort || require('./module-port.js');
  var ModuleUnit = app.ModuleUnit || require('../models/module-unit.js');

  var Module = Component.inherits(function(props) {
    this.title = this.prop(props.title);
    this.name = this.prop(props.name);
    this.x = this.prop(props.x);
    this.y = this.prop(props.y);
    this.zIndex = this.prop('auto');
    this.deletable = this.prop(true);
    this.ports = this.prop([]);
    this.portListTop = this.prop(0);
    this.portListHeight = this.prop(0);
    this.eventCircuitElement = this.prop(null);
    this.messageData = this.prop(helper.randomString(7));
    this.isLoading = this.prop(false);
    this.isError = this.prop(false);
    this.isMoving = this.prop(false);
    this.isDeleting = this.prop(false);
    this.parentElement = this.prop(props.parentElement);

    this.messageListenable = new dom.Listenable({
      callback: Module.prototype.onmessage.bind(this),
    });

    this.toggledPortSet = new helper.Set();
    this.draggable = null;

    this.onchange = Module.prototype.onchange.bind(this);
    this.onpoint = Module.prototype.onpoint.bind(this);

    this.deleter = props.deleter;
    this.fronter = props.fronter;
    this.portToggler = props.portToggler;
    this.portEventer = props.portEventer;
    this.dragStarter = props.dragStarter;
    this.dragEnder = props.dragEnder;
    this.dragPortPlugStarter = props.dragPortPlugStarter;
    this.dragPortPlugMover = props.dragPortPlugMover;
    this.dragPortPlugEnder = props.dragPortPlugEnder;
    this.dragPortSocketStarter = props.dragPortSocketStarter;
    this.dragPortSocketMover = props.dragPortSocketMover;
    this.dragPortSocketEnder = props.dragPortSocketEnder;
  });

  Module.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  Module.prototype.titleElement = function() {
    return dom.child(this.element(), 0, 0);
  };

  Module.prototype.deleteButtonElement = function() {
    return dom.child(this.element(), 0, 1);
  };

  Module.prototype.componentElement = function() {
    return dom.child(this.element(), 1, 0);
  };

  Module.prototype.portListElement = function() {
    return dom.child(this.element(), 1, 1);
  };

  Module.prototype.footerElement = function() {
    return dom.child(this.element(), 2);
  };

  Module.prototype.portSelectElement = function() {
    return dom.child(this.element(), 2, 1);
  };

  Module.prototype.portOptGroupElement = (function() {
    var map = { prop: 0, event: 1 };
    return function(type) {
      return dom.child(this.element(), 2, 1, map[type]);
    };
  })();

  Module.prototype.componentContentWindow = function() {
    return dom.contentWindow(this.componentElement());
  };

  Module.prototype.circuitElement = function() {
    return helper.dig(this.componentContentWindow(), 'modular', 'exports');
  };

  Module.prototype.circuitElementMember = function(name) {
    var circuitElement = this.circuitElement();
    return (circuitElement ? circuitElement.get(name) : null);
  };

  Module.prototype.diagonalPoint = function() {
    var rect = dom.rect(this.element());
    return new dom.Point({
      x: this.x() + rect.width + (this.hasVisiblePortPlug() ? ModulePort.PLUG_WIDTH : 0),
      y: this.y() + rect.height,
    });
  };

  Module.prototype.hasVisiblePortPlug = function() {
    return this.visiblePorts().some(function(port) {
      return !port.plugDisabled();
    });
  };

  Module.prototype.hasVisiblePortSocket = function() {
    return this.visiblePorts().some(function(port) {
      return !port.socketDisabled();
    });
  };

  Module.prototype.plugPosition = function(port) {
    return new dom.Point({
      x: this.x() + ModulePort.PLUG_OFFSET_X,
      y: this.y() + this.portListTop() + port.middle(),
    });
  };

  Module.prototype.socketPosition = function(port) {
    return new dom.Point({
      x: this.x() + ModulePort.SOCKET_OFFSET_X,
      y: this.y() + this.portListTop() + port.middle(),
    });
  };

  Module.prototype.port = function(name) {
    return helper.find(this.ports(), function(port) {
      return (port.name() === name);
    });
  };

  Module.prototype.targetPort = function(target) {
    return helper.find(this.ports(), function(port) {
      return dom.contains(port.listItemElement(), target);
    });
  };

  Module.prototype.eventPorts = function() {
    return this.ports().filter(function(port) {
      return (port.type() === ModulePort.TYPE_EVENT);
    });
  };

  Module.prototype.visiblePorts = function() {
    return this.ports().filter(function(port) {
      return port.visible();
    });
  };

  Module.prototype.isAllPortsVisible = function() {
    return (this.visiblePorts().length === this.ports().length);
  };

  Module.prototype.url = function() {
    return [
      'modular_modules/',
      this.name().split('/').map(function(s) {
        return encodeURIComponent(s);
      }).join('/'),
      '.html',
    ].join('');
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

  Module.prototype.createPorts = function() {
    return this.circuitElement().getAll().map(function(member) {
      var props = member.props();
      return new ModulePort(helper.extend(helper.clone(props), {
        parentListElement: this.portListElement(),
        parentOptGroupElement: this.portOptGroupElement(props.type),
      }));
    }.bind(this));
  };

  Module.prototype.createEventCircuitElement = function() {
    return new CircuitElement(this.eventPorts().map(function(port) {
      return {
        label: port.label(),
        name: port.name(),
        type: port.type(),
        arg: this.portEventer.bind(null, new ModuleUnit({ module: this, port: port })),
      };
    }.bind(this)));
  };

  Module.prototype.bindEventCircuitElement = function() {
    var eventCircuitElement = this.eventCircuitElement();

    if (!eventCircuitElement) {
      return;
    }

    var circuitElement = this.circuitElement();
    eventCircuitElement.getAll().forEach(function(member) {
      CircuitElement.bind(circuitElement.get(member.props().name), member);
    });
  };

  Module.prototype.unbindEventCircuitElement = function() {
    var eventCircuitElement = this.eventCircuitElement();

    if (!eventCircuitElement) {
      return;
    }

    var circuitElement = this.circuitElement();
    eventCircuitElement.getAll().forEach(function(member) {
      CircuitElement.unbind(circuitElement.get(member.props().name), member);
    });
  };

  Module.prototype.registerComponentPointListener = function() {
    dom.on(this.componentContentWindow(), dom.eventType('start'), this.onpoint, true);
  };

  Module.prototype.unregisterComponentPointListener = function() {
    dom.off(this.componentContentWindow(), dom.eventType('start'), this.onpoint, true);
  };

  Module.prototype.registerDragListener = function() {
    this.draggable = new dom.Draggable({
      element: this.element(),
      onstart: Module.prototype.onstart.bind(this),
      onmove: Module.prototype.onmove.bind(this),
      onend: Module.prototype.onend.bind(this),
    });
  };

  Module.prototype.unregisterDragListener = function() {
    this.draggable.destroy();
    this.draggable = null;
  };

  Module.prototype.registerPortSelectChangeListener = function() {
    dom.on(this.portSelectElement(), 'change', this.onchange);
  };

  Module.prototype.unregisterPortSelectChangeListener = function() {
    dom.off(this.portSelectElement(), 'change', this.onchange);
  };

  Module.prototype.registerPointListener = function() {
    dom.on(this.element(), dom.eventType('start'), this.onpoint, true);
  };

  Module.prototype.unregisterPointListener = function() {
    dom.off(this.element(), dom.eventType('start'), this.onpoint, true);
  };

  Module.prototype.registerMessageListener = function(resolve, reject) {
    var messageListenable = this.messageListenable;
    messageListenable.register(resolve, reject);
    dom.on(this.componentContentWindow(), 'message', messageListenable.listener);
  };

  Module.prototype.unregisterMessageListener = function() {
    var messageListenable = this.messageListenable;
    dom.off(this.componentContentWindow(), 'message', messageListenable.listener);
    messageListenable.unregister();
  };

  Module.prototype.setComponentContent = function(contentText, messageData) {
    dom.name(this.componentContentWindow(), messageData);
    dom.writeContent(this.componentElement(), contentText);
  };

  Module.prototype.resetComponentHeight = function() {
    dom.fillContentHeight(this.componentElement());
    this.portListTop(dom.offsetHeight(this.headerElement()) + dom.offsetHeight(this.componentElement()) + 1);
  };

  Module.prototype.toggledPorts = function() {
    return this.toggledPortSet.toArray();
  };

  Module.prototype.clearToggledPorts = function() {
    this.toggledPortSet.clear();
  };

  Module.prototype.markToggled = function(port) {
    this.toggledPortSet.add(port);
  };

  Module.prototype.resetPortSelect = function() {
    this.ports().forEach(function(port) {
      this.markToggled(port);
    }.bind(this));
  };

  Module.prototype.exportModularModule = (function() {
    var ModularModule = function(member) {
      return new CircuitElement(member);
    };
    return function() {
      var globalApp = dom.global().app;
      if (globalApp.ModularModule !== ModularModule) {
        globalApp.ModularModule = ModularModule;
      }
    };
  })();

  Module.prototype.loadComponent = function() {
    this.isLoading(true);
    return dom.ajax({
      type: 'GET',
      url: this.url(),
    }).then(function(text) {
      this.exportModularModule();
      this.setComponentContent(text, this.messageData());
      return Promise.race([
        new Promise(this.registerMessageListener.bind(this)),
        new Promise(function(resolve, reject) {
          setTimeout(reject, 30 * 1000, new Error('Load timeout for content'));
        }),
      ]);
    }.bind(this)).then(function() {
      this.unregisterMessageListener();
      this.isLoading(false);
      this.resetComponentHeight();
      this.ports(this.createPorts());
      this.resetPortSelect();
      this.eventCircuitElement(this.createEventCircuitElement());
      this.bindEventCircuitElement();
      this.registerComponentPointListener();
    }.bind(this)).catch(function(e) {
      this.unregisterMessageListener();
      this.isError(true);
      throw e;
    }.bind(this));
  };

  Module.prototype.showPort = function(name) {
    var port = this.port(name);

    if (!port || port.visible()) {
      return;
    }

    // add the port to the end of the list
    var portListHeight = this.portListHeight();
    this.portListHeight(portListHeight + port.height());
    port.top(portListHeight);
    port.visible(true);
    this.markToggled(port);

    // move right not to position the port-socket outside
    if (this.x() < ModulePort.SOCKET_WIDTH && this.hasVisiblePortSocket()) {
      this.x(ModulePort.SOCKET_WIDTH);
    }

    this.portToggler(new ModuleUnit({ module: this, port: port }));
  };

  Module.prototype.hidePort = function(name) {
    var port = this.port(name);

    if (!port || !port.visible()) {
      return;
    }

    var visiblePorts = this.visiblePorts().sort(function(a, b) {
      return a.top() - b.top();
    });

    port.visible(false);
    this.markToggled(port);

    // move up the ports below the hidden port
    visiblePorts.slice(visiblePorts.indexOf(port) + 1).forEach(function(visiblePort) {
      visiblePort.top(visiblePort.top() - port.height());
    });

    this.portListHeight(this.portListHeight() - port.height());
    this.portToggler(new ModuleUnit({ module: this, port: port }));
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
    this.deleter(this);
  };

  Module.prototype.render = function() {
    var element = dom.el('<div>');
    dom.addClass(element, 'module');
    dom.html(element, Module.TEMPLATE_HTML);
    return element;
  };

  Module.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element) {
      return;
    }

    // add element
    if (parentElement && !element) {
      this.element(this.render());
      this.registerDragListener();
      this.registerPortSelectChangeListener();
      this.registerPointListener();
      this.redraw();
      dom.append(parentElement, this.element());
      return;
    }

    // remove element
    if (!parentElement && element) {
      this.unregisterDragListener();
      this.unregisterPortSelectChangeListener();
      this.unregisterPointListener();
      this.unbindEventCircuitElement();
      this.unregisterComponentPointListener();
      dom.remove(element);
      this.element(null);
      this.clearCache();
      return;
    }

    // update element
    this.redrawTitle();
    this.redrawPosition();
    this.redrawZIndex();
    this.redrawDeletable();
    this.redrawPortList();
    this.redrawFooter();
    this.redrawPortSelect();
    this.redrawToggleClasses();
  };

  Module.prototype.redrawTitle = function() {
    this.redrawProp('title', function(title) {
      dom.text(this.titleElement(), title);
    });
  };

  Module.prototype.redrawPosition = function() {
    this.redrawProp('x', 'y', function(x, y) {
      dom.translate(this.element(), x, y);
    });
  };

  Module.prototype.redrawZIndex = function() {
    this.redrawProp('zIndex', function(zIndex) {
      dom.css(this.element(), { zIndex: zIndex });
    });
  };

  Module.prototype.redrawDeletable = function() {
    this.redrawProp('deletable', function(deletable) {
      dom.toggleClass(this.deleteButtonElement(), 'disabled', !deletable);
    });
  };

  Module.prototype.redrawPortList = function() {
    this.redrawProp('portListHeight', function(portListHeight) {
      dom.css(this.portListElement(), { height: portListHeight + 'px' });
    });
  };

  Module.prototype.redrawFooter = function() {
    this.redrawProp('isAllPortsVisible', function(isAllPortsVisible) {
      dom.toggleClass(this.footerElement(), 'hide', isAllPortsVisible);
    });
  };

  Module.prototype.redrawPortSelect = function() {
    var toggledPorts = this.toggledPorts();

    if (toggledPorts.length === 0) {
      return;
    }

    // update select element of toggled port
    toggledPorts.forEach(function(port) {
      port.redraw();
    });

    // sort options by name
    [ModulePort.TYPE_PROP, ModulePort.TYPE_EVENT].forEach(function(type) {
      dom.sort(this.portOptGroupElement(type));
    }.bind(this));

    // deselect option
    dom.value(this.portSelectElement(), '');

    this.clearToggledPorts();
  };

  Module.prototype.redrawToggleClasses = function() {
    this.redrawToggleClass('isLoading', 'loading');
    this.redrawToggleClass('isError', 'error');
    this.redrawToggleClass('isMoving', 'moving');
    this.redrawToggleClass('isDeleting', 'deleting');
  };

  Module.prototype.dragType = function(target) {
    if (target === this.titleElement()) {
      return Module.DRAG_TYPE_POSITION;
    } else if (target === this.deleteButtonElement()) {
      return Module.DRAG_TYPE_DELETE;
    } else if (dom.hasClass(target, 'module-port-hide-button')) {
      return Module.DRAG_TYPE_HIDE_PORT;
    } else if (dom.hasClass(target, 'module-port-label')) {
      return Module.DRAG_TYPE_SORT_PORT;
    } else if (dom.hasClass(target, 'module-port-plug')) {
      return Module.DRAG_TYPE_DRAG_PORT_PLAG;
    } else if (dom.hasClass(dom.parent(target), 'module-port-socket')) {
      return Module.DRAG_TYPE_DRAG_PORT_SOCKET;
    } else {
      return null;
    }
  };

  Module.prototype.onstart = function(x, y, event, context) {
    var type = this.dragType(dom.target(event));
    context.type = type;

    if (!type) {
      return;
    }

    dom.cancel(event);
    Module.DRAG_LISTENERS[type].onstart.call(this, x, y, event, context);
    this.dragStarter();
  };

  Module.prototype.onmove = function(dx, dy, event, context) {
    var type = context.type;

    if (!type) {
      return;
    }

    Module.DRAG_LISTENERS[type].onmove.call(this, dx, dy, event, context);
  };

  Module.prototype.onend = function(dx, dy, event, context) {
    var type = context.type;

    if (!type) {
      return;
    }

    Module.DRAG_LISTENERS[type].onend.call(this, dx, dy, event, context);
    this.dragEnder();
  };

  Module.prototype.onmessage = function(event) {
    if (dom.origin(event) !== dom.urlOrigin(dom.location())) {
      throw new Error('Invalid content origin');
    }
    if (dom.messageData(event) !== this.messageData()) {
      throw new Error('Invalid content data');
    }
    if (!this.circuitElement()) {
      throw new Error('Invalid circuit element');
    }
  };

  Module.prototype.onchange = function(event) {
    this.showPort(dom.value(dom.target(event)));
    dom.removeFocus();
  };

  Module.prototype.onpoint = function() {
    this.fronter(this);
  };

  Module.DRAG_TYPE_POSITION = 'position';
  Module.DRAG_TYPE_DELETE = 'delete';
  Module.DRAG_TYPE_HIDE_PORT = 'hidePort';
  Module.DRAG_TYPE_SORT_PORT = 'sortPort';
  Module.DRAG_TYPE_DRAG_PORT_PLAG = 'dragPortPlug';
  Module.DRAG_TYPE_DRAG_PORT_SOCKET = 'dragPortSocket';

  Module.DRAG_TYPE_POSITION_LISTENER = {
    onstart: function(x, y, event, context) {
      context.x = this.x();
      context.y = this.y();
      this.isMoving(true);
    },
    onmove: function(dx, dy, event, context) {
      this.x(Math.max(context.x + dx, (this.hasVisiblePortSocket() ? ModulePort.SOCKET_WIDTH : 0)));
      this.y(Math.max(context.y + dy, 0));
    },
    onend: function(dx, dy, event, context) {
      this.isMoving(false);
    },
  };

  Module.DRAG_TYPE_DELETE_LISTENER = {
    onstart: function(x, y, event, context) {
      context.target = dom.target(event);
      this.isDeleting(true);
    },
    onmove: function(dx, dy, event, context) {
      this.isDeleting(dom.target(event) === context.target);
    },
    onend: function(dx, dy, event, context) {
      this.isDeleting(false);
      if (dom.target(event) === context.target) {
        this.delete();
      }
    },
  };

  Module.DRAG_TYPE_HIDE_PORT_LISTENER = {
    onstart: function(x, y, event, context) {
      context.target = dom.target(event);
      context.port = this.targetPort(context.target);
    },
    onmove: function() { /* do nothing */ },
    onend: function(dx, dy, event, context) {
      if (dom.target(event) === context.target) {
        this.hidePort(context.port.name());
      }
    },
  };

  Module.DRAG_TYPE_SORT_PORT_LISTENER = {
    onstart: function(x, y, event, context) {
      var port = this.targetPort(dom.target(event));
      var top = port.top();
      context.port = port;
      context.top = top;
      context.placeholderTop = top;
      port.isMoving(true);
    },
    onmove: function(dx, dy, event, context) {
      var targetPort = context.port;

      // move the target port within the port list
      targetPort.top(helper.clamp(context.top + dy, 0, this.portListHeight() - targetPort.height()));

      if (targetPort.top() - context.placeholderTop > 0) {
        Module.DRAG_TYPE_SORT_PORT_LISTENER.onmovedown.call(this, dx, dy, event, context);
      } else {
        Module.DRAG_TYPE_SORT_PORT_LISTENER.onmoveup.call(this, dx, dy, event, context);
      }
    },
    onmovedown: function(dx, dy, event, context) {
      var targetPort = context.port;
      var targetPortHeight = targetPort.height();
      var targetPortMiddle = targetPort.middle();
      var placeholderTop = context.placeholderTop;

      // move up the ports over the target port
      this.visiblePorts().filter(function(port) {
        var top = port.top();
        return (port !== targetPort && placeholderTop <= top && top < targetPortMiddle);
      }).forEach(function(port) {
        port.top(port.top() - targetPortHeight);
        placeholderTop = Math.max(placeholderTop, port.bottom());
      });

      context.placeholderTop = placeholderTop;
    },
    onmoveup: function(dx, dy, event, context) {
      var targetPort = context.port;
      var targetPortHeight = targetPort.height();
      var targetPortMiddle = targetPort.middle();
      var placeholderTop = context.placeholderTop;

      // move down the ports under the target port
      this.visiblePorts().filter(function(port) {
        var bottom = port.bottom();
        return (port !== targetPort && targetPortMiddle < bottom && bottom <= placeholderTop);
      }).forEach(function(port) {
        var top = port.top();
        port.top(top + targetPortHeight);
        placeholderTop = Math.min(placeholderTop, top);
      });

      context.placeholderTop = placeholderTop;
    },
    onend: function(dx, dy, event, context) {
      var port = context.port;
      port.top(context.placeholderTop);
      port.isMoving(false);
    },
  };

  Module.DRAG_TYPE_DRAG_PORT_PLAG_LISTENER = {
    onstart: function(x, y, event, context) {
      var port = this.targetPort(dom.target(event));
      context.unit = new ModuleUnit({ module: this, port: port });
      context.context = {};
      this.dragPortPlugStarter(context.unit, context.context);
    },
    onmove: function(dx, dy, event, context) {
      this.dragPortPlugMover(context.unit, dx, dy, context.context);
    },
    onend: function(dx, dy, event, context) {
      this.dragPortPlugEnder(context.unit, context.context);
    },
  };

  Module.DRAG_TYPE_DRAG_PORT_SOCKET_LISTENER = {
    onstart: function(x, y, event, context) {
      var port = this.targetPort(dom.target(event));
      context.unit = new ModuleUnit({ module: this, port: port });
      context.context = {};
      this.dragPortSocketStarter(context.unit, context.context);
    },
    onmove: function(dx, dy, event, context) {
      this.dragPortSocketMover(context.unit, dx, dy, context.context);
    },
    onend: function(dx, dy, event, context) {
      this.dragPortSocketEnder(context.unit, context.context);
    },
  };

  Module.DRAG_LISTENERS = (function() {
    var listeners = {};
    listeners[Module.DRAG_TYPE_POSITION] = Module.DRAG_TYPE_POSITION_LISTENER;
    listeners[Module.DRAG_TYPE_DELETE] = Module.DRAG_TYPE_DELETE_LISTENER;
    listeners[Module.DRAG_TYPE_HIDE_PORT] = Module.DRAG_TYPE_HIDE_PORT_LISTENER;
    listeners[Module.DRAG_TYPE_SORT_PORT] = Module.DRAG_TYPE_SORT_PORT_LISTENER;
    listeners[Module.DRAG_TYPE_DRAG_PORT_PLAG] = Module.DRAG_TYPE_DRAG_PORT_PLAG_LISTENER;
    listeners[Module.DRAG_TYPE_DRAG_PORT_SOCKET] = Module.DRAG_TYPE_DRAG_PORT_SOCKET_LISTENER;
    return listeners;
  })();

  Module.TEMPLATE_HTML = [
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
        '<optgroup label="Property"></optgroup>',
        '<optgroup label="Event"></optgroup>',
      '</select>',
    '</div>',
  ].join('');

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Module;
  } else {
    app.Module = Module;
  }
})(this.app || (this.app = {}));
