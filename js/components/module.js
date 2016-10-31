(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitElement = app.CircuitElement || require('../models/circuit-element.js');
  var ModulePort = app.ModulePort || require('./module-port.js');

  var Module = helper.inherits(function(props) {
    Module.super_.call(this);

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
    this.element = this.prop(null);
    this.parentElement = this.prop(props.parentElement);
    this.cache = this.prop({});
    this.draggable = this.prop(null);
    this.dragContext = this.prop({});

    this.onmessage = null;
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
  }, jCore.Component);

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

  Module.prototype.portOptGroupElement = function(type) {
    var index = ({ prop: 0, event: 1 })[type];
    return dom.child(this.element(), 2, 1, index);
  };

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
    return {
      x: this.x() + rect.width + (this.hasVisiblePortPlug() ? ModulePort.PLUG_WIDTH : 0),
      y: this.y() + rect.height
    };
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
    return {
      x: this.x() + ModulePort.PLUG_OFFSET_X,
      y: this.y() + this.portListTop() + port.middle()
    };
  };

  Module.prototype.socketPosition = function(port) {
    return {
      x: this.x() + ModulePort.SOCKET_OFFSET_X,
      y: this.y() + this.portListTop() + port.middle()
    };
  };

  Module.prototype.port = function(name) {
    return this.ports().filter(function(port) {
      return (port.name() === name);
    })[0] || null;
  };

  Module.prototype.targetPort = function(target) {
    return this.ports().filter(function(port) {
      return dom.contains(port.listItemElement(), target);
    })[0] || null;
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
      '.html'
    ].join('');
  };

  Module.prototype.createPorts = function() {
    return this.circuitElement().getAll().map(function(member) {
      var props = member.props();
      return new ModulePort(helper.extend(helper.clone(props), {
        parentListElement: this.portListElement(),
        parentOptGroupElement: this.portOptGroupElement(props.type)
      }));
    }.bind(this));
  };

  Module.prototype.createEventCircuitElement = function() {
    return new CircuitElement(this.eventPorts().map(function(port) {
      return {
        label: port.label(),
        name: port.name(),
        type: port.type(),
        arg: this.portEventer.bind(null, this, port)
      };
    }.bind(this)));
  };

  Module.prototype.bindEventCircuitElement = function() {
    var eventCircuitElement = this.eventCircuitElement();

    if (!eventCircuitElement)
      return;

    var circuitElement = this.circuitElement();
    eventCircuitElement.getAll().forEach(function(member) {
      CircuitElement.bind(circuitElement.get(member.props().name), member);
    });
  };

  Module.prototype.unbindEventCircuitElement = function() {
    var eventCircuitElement = this.eventCircuitElement();

    if (!eventCircuitElement)
      return;

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
    this.draggable(new dom.Draggable({
      element: this.element(),
      onstart: Module.prototype.onstart.bind(this),
      onmove: Module.prototype.onmove.bind(this),
      onend: Module.prototype.onend.bind(this)
    }));
  };

  Module.prototype.unregisterDragListener = function() {
    this.draggable().destroy();
    this.draggable(null);
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
    if (this.onmessage)
      return;

    this.onmessage = (function(event) {
      try {
        if (event.origin !== dom.origin())
          throw new Error('Invalid content origin');
        if (event.data !== this.messageData())
          throw new Error('Invalid content data');
        if (!this.circuitElement())
          throw new Error('Invalid circuit element');
        resolve();
      } catch(e) {
        reject(e);
      }
    }).bind(this);

    dom.on(this.componentContentWindow(), 'message', this.onmessage);
  };

  Module.prototype.unregisterMessageListener = function() {
    if (!this.onmessage)
      return;

    dom.off(this.componentContentWindow(), 'message', this.onmessage);
    this.onmessage = null;
  };

  Module.prototype.setComponentContent = function(contentText, messageData) {
    dom.name(this.componentContentWindow(), messageData);
    dom.writeContent(this.componentElement(), contentText);
  };

  Module.prototype.resetComponentHeight = function() {
    dom.fillContentHeight(this.componentElement());
    this.portListTop(dom.offsetHeight(this.headerElement()) + dom.offsetHeight(this.componentElement()) + 1);
  };

  Module.prototype.resetPortSelect = function() {
    this.ports().forEach(function(port) {
      this.needsUpdatePortSelect(port);
    }.bind(this));
  };

  Module.prototype.exportModularModule = (function() {
    var ModularModule = function(member) {
      return new CircuitElement(member);
    };
    return function() {
      var globalApp = dom.global().app;
      if (globalApp.ModularModule !== ModularModule)
        globalApp.ModularModule = ModularModule;
    };
  })();

  Module.prototype.loadComponent = function() {
    this.isLoading(true);
    return dom.ajax({
      type: 'GET',
      url: this.url()
    }).then(function(text) {
      this.exportModularModule();
      this.setComponentContent(text, this.messageData());
      return Promise.race([
        new Promise(this.registerMessageListener.bind(this)),
        new Promise(function(resolve, reject) {
          setTimeout(reject, 30 * 1000, new Error('Load timeout for content'));
        })
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

    if (!port || port.visible())
      return;

    // add the port to the end of the list
    var portListHeight = this.portListHeight();
    this.portListHeight(portListHeight + port.height());
    port.top(portListHeight);
    port.visible(true);
    this.needsUpdatePortSelect(port);

    // move right not to position the port-socket outside
    if (this.x() < ModulePort.SOCKET_WIDTH && this.hasVisiblePortSocket())
      this.x(ModulePort.SOCKET_WIDTH);

    this.portToggler(this, port);
  };

  Module.prototype.hidePort = function(name) {
    var port = this.port(name);

    if (!port || !port.visible())
      return;

    var visiblePorts = this.visiblePorts().sort(function(a, b) {
      return a.top() - b.top();
    });

    port.visible(false);
    this.needsUpdatePortSelect(port);

    // move up the ports below the hidden port
    visiblePorts.slice(visiblePorts.indexOf(port) + 1).forEach(function(visiblePort) {
      visiblePort.top(visiblePort.top() - port.height());
    });

    this.portListHeight(this.portListHeight() - port.height());
    this.portToggler(this, port);
  };

  Module.prototype.needsUpdatePortSelect = function(port) {
    var cache = this.cache();
    if (!cache.toggledPorts)
      cache.toggledPorts = [];
    if (cache.toggledPorts.indexOf(port) === -1)
      cache.toggledPorts.push(port);
  };

  Module.prototype.delete = function() {
    // remove all connections of connected ports
    this.ports().forEach(function(port) {
      this.hidePort(port.name());
    }.bind(this));

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

    if (!parentElement && !element)
      return;

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
      this.cache({});
      this.dragContext({});
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
    this.redrawStates();
  };

  Module.prototype.redrawTitle = function() {
    var title = this.title();
    var cache = this.cache();

    if (title === cache.title)
      return;

    dom.text(this.titleElement(), title);
    cache.title = title;
  };

  Module.prototype.redrawPosition = function() {
    var x = this.x();
    var y = this.y();
    var cache = this.cache();

    if (x === cache.x && y === cache.y)
      return;

    var translate = 'translate(' + x + 'px, ' + y + 'px)';

    dom.css(this.element(), {
      transform: translate,
      webkitTransform: translate
    });

    cache.x = x;
    cache.y = y;
  };

  Module.prototype.redrawZIndex = function() {
    var zIndex = this.zIndex();
    var cache = this.cache();

    if (zIndex === cache.zIndex)
      return;

    dom.css(this.element(), { zIndex: zIndex });
    cache.zIndex = zIndex;
  };

  Module.prototype.redrawDeletable = function() {
    var deletable = this.deletable();
    var cache = this.cache();

    if (deletable === cache.deletable)
      return;

    dom.toggleClass(this.element(), 'module-delete-disabled', !deletable);
    cache.deletable = deletable;
  };

  Module.prototype.redrawPortList = function() {
    var portListHeight = this.portListHeight();
    var cache = this.cache();

    if (portListHeight === cache.portListHeight)
      return;

    dom.css(this.portListElement(), { height: portListHeight + 'px' });
    cache.portListHeight = portListHeight;
  };

  Module.prototype.redrawFooter = function() {
    var isAllPortsVisible = this.isAllPortsVisible();
    var cache = this.cache();

    if (isAllPortsVisible === cache.isAllPortsVisible)
      return;

    dom.toggleClass(this.footerElement(), 'hide', isAllPortsVisible);
    cache.isAllPortsVisible = isAllPortsVisible;
  };

  Module.prototype.redrawPortSelect = function() {
    var cache = this.cache();
    var toggledPorts = cache.toggledPorts;

    if (!toggledPorts)
      return;

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

    cache.toggledPorts = null;
  };

  Module.prototype.redrawStates = function() {
    this.redrawState('isLoading', 'module-loading');
    this.redrawState('isError', 'module-error');
    this.redrawState('isMoving', 'module-moving');
    this.redrawState('isDeleting', 'module-deleting');
  };

  Module.prototype.redrawState = function(key, className) {
    var cache = this.cache();
    var value = this[key]();
    if (value !== cache[key]) {
      dom.toggleClass(this.element(), className, value);
      cache[key] = value;
    }
  };

  Module.prototype.dragType = function(target) {
    if (target === this.titleElement())
      return Module.DRAG_TYPE_POSITION;
    else if (target === this.deleteButtonElement())
      return Module.DRAG_TYPE_DELETE;
    else if (dom.hasClass(target, 'module-port-hide-button'))
      return Module.DRAG_TYPE_HIDE_PORT;
    else if (dom.hasClass(target, 'module-port-label'))
      return Module.DRAG_TYPE_SORT_PORT;
    else if (dom.hasClass(target, 'module-port-plug'))
      return Module.DRAG_TYPE_DRAG_PORT_PLAG;
    else if (dom.hasClass(dom.parent(target), 'module-port-socket'))
      return Module.DRAG_TYPE_DRAG_PORT_SOCKET;
    else
      return null;
  };

  Module.prototype.onstart = function(x, y, event) {
    var context = this.dragContext();
    var type = context.type = this.dragType(dom.target(event));

    if (!type)
      return;

    dom.cancel(event);
    Module.DRAG_LISTENERS[type].onstart.call(this, x, y, event, context);
    this.dragStarter();
  };

  Module.prototype.onmove = function(dx, dy, event) {
    var context = this.dragContext();
    var type = context.type;

    if (!type)
      return;

    Module.DRAG_LISTENERS[type].onmove.call(this, dx, dy, event, context);
  };

  Module.prototype.onend = function(dx, dy, event) {
    var context = this.dragContext();
    var type = context.type;

    if (!type)
      return;

    Module.DRAG_LISTENERS[type].onend.call(this, dx, dy, event, context);
    this.dragEnder();
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
    }
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
      if (dom.target(event) === context.target)
        this.delete();
    }
  };

  Module.DRAG_TYPE_HIDE_PORT_LISTENER = {
    onstart: function(x, y, event, context) {
      context.target = dom.target(event);
      context.port = this.targetPort(context.target);
    },
    onmove: function() { /* do nothing */ },
    onend: function(dx, dy, event, context) {
      if (dom.target(event) === context.target)
        this.hidePort(context.port.name());
    }
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

      if (targetPort.top() - context.placeholderTop > 0)
        Module.DRAG_TYPE_SORT_PORT_LISTENER.onmovedown.call(this, dx, dy, event, context);
      else
        Module.DRAG_TYPE_SORT_PORT_LISTENER.onmoveup.call(this, dx, dy, event, context);
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
    }
  };

  Module.DRAG_TYPE_DRAG_PORT_PLAG_LISTENER = {
    onstart: function(x, y, event, context) {
      context.port = this.targetPort(dom.target(event));
      context.context = {};
      this.dragPortPlugStarter(this, context.port, context.context);
    },
    onmove: function(dx, dy, event, context) {
      this.dragPortPlugMover(this, context.port, dx, dy, context.context);
    },
    onend: function(dx, dy, event, context) {
      this.dragPortPlugEnder(this, context.port, context.context);
    }
  };

  Module.DRAG_TYPE_DRAG_PORT_SOCKET_LISTENER = {
    onstart: function(x, y, event, context) {
      context.port = this.targetPort(dom.target(event));
      context.context = {};
      this.dragPortSocketStarter(this, context.port, context.context);
    },
    onmove: function(dx, dy, event, context) {
      this.dragPortSocketMover(this, context.port, dx, dy, context.context);
    },
    onend: function(dx, dy, event, context) {
      this.dragPortSocketEnder(this, context.port, context.context);
    }
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
      '<div class="module-header-title"></div>',
      '<div class="module-header-delete-button"></div>',
    '</div>',
    '<div class="module-content">',
      '<iframe class="module-component"></iframe>',
      '<div class="module-port-list"></div>',
    '</div>',
    '<div class="module-footer">',
      '<img class="module-footer-icon" src="images/caret-down.svg">',
      '<select class="module-port-select">',
        '<optgroup label="Property"></optgroup>',
        '<optgroup label="Event"></optgroup>',
      '</select>',
    '</div>'
  ].join('');

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Module;
  else
    app.Module = Module;
})(this.app || (this.app = {}));
