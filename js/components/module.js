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
    this.ports = this.prop([]);
    this.portListTop = this.prop(0);
    this.portListHeight = this.prop(0);
    this.eventCircuitElement = this.prop(null);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
    this.draggable = this.prop(null);
    this.dragContext = this.prop({});

    this.onchange = Module.prototype.onchange.bind(this);
    this.onpoint = Module.prototype.onpoint.bind(this);

    this.optionDeselector = Module.prototype.deselectOption.bind(this);
    this.optGroupSorter = Module.prototype.sortOptGroup.bind(this);

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

  Module.prototype.circuitElement = function() {
    return helper.dig(dom.contentWindow(this.componentElement()), 'modular', 'exports');
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
    return this.ports().some(function(port) {
      return port.visible() && !port.plugDisabled();
    });
  };

  Module.prototype.hasVisiblePortSocket = function() {
    return this.ports().some(function(port) {
      return port.visible() && !port.socketDisabled();
    });
  };

  Module.prototype.plugPosition = function(port) {
    return {
      x: this.x() + ModulePort.PLUG_OFFSET_X,
      y: this.y() + this.portListTop() + port.top() + port.height() / 2
    };
  };

  Module.prototype.socketPosition = function(port) {
    return {
      x: this.x() + ModulePort.SOCKET_OFFSET_X,
      y: this.y() + this.portListTop() + port.top() + port.height() / 2
    };
  };

  Module.prototype.port = function(name) {
    return this.ports().filter(function(port) {
      return (port.name() === name);
    })[0] || null;
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

  Module.prototype.deletable = function() {
    return this.ports().every(function(port) {
      return port.hideable();
    });
  };

  Module.prototype.createPorts = function() {
    return this.circuitElement().getAll().map(function(member) {
      var props = member.props();
      return new ModulePort(helper.extend({}, props, {
        parentListElement: this.portListElement(),
        parentOptGroupElement: this.portOptGroupElement(props.type),
        optionDeselector: this.optionDeselector,
        optGroupSorter: this.optGroupSorter
      }));
    }.bind(this));
  };

  Module.prototype.createEventCircuitElement = function() {
    return new CircuitElement(this.ports().filter(function(port) {
      return (port.type() === ModulePort.TYPE_EVENT);
    }).map(function(port) {
      return {
        label: port.label(),
        name: port.name(),
        type: port.type(),
        arg: this.portEventer.bind(null, this, port)
      };
    }.bind(this)));
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
    dom.addClass(this.element(), 'module-loading');

    return dom.ajax({
      type: 'GET',
      url: this.url()
    }).then(function(text) {
      var componentElement = this.componentElement();
      var contentWindow = dom.contentWindow(componentElement);
      var data = Date.now().toString();

      this.exportModularModule();

      dom.name(contentWindow, data);
      dom.writeContent(componentElement, text);

      var onmessage;

      return Promise.race([
        new Promise(function(resolve, reject) {
          onmessage = function(event) {
            try {
              if (event.origin !== dom.origin())
                throw new Error('Invalid content origin');

              if (event.data !== data)
                throw new Error('Invalid content data');

              var circuitElement = this.circuitElement();

              if (!circuitElement)
                throw new Error('Invalid circuit element');

              this.ports(this.createPorts());
              this.eventCircuitElement(this.createEventCircuitElement());

              this.eventCircuitElement().getAll().forEach(function(member) {
                CircuitElement.bind(circuitElement.get(member.props().name), member);
              });

              var contentWindow = dom.contentWindow(this.componentElement());
              if (contentWindow)
                dom.on(contentWindow, dom.eventType('start'), this.onpoint, true);

              resolve();
            } catch(e) {
              reject(e);
            }
          }.bind(this);

          dom.on(contentWindow, 'message', onmessage);
        }.bind(this)),
        new Promise(function(resolve, reject) {
          setTimeout(reject, 30 * 1000, new Error('Load timeout for content'));
        })
      ]).then(function() {
        dom.off(contentWindow, 'message', onmessage);
        dom.removeClass(this.element(), 'module-loading');
        dom.fillContentHeight(componentElement);
        this.portListTop(dom.offsetHeight(this.headerElement()) + dom.offsetHeight(this.componentElement()) + 1);
      }.bind(this)).catch(function(e) {
        dom.off(contentWindow, 'message', onmessage);
        throw e;
      });
    }.bind(this)).catch(function(e) {
      dom.addClass(this.element(), 'module-error');
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

    // move up the ports below the hidden port
    visiblePorts.slice(visiblePorts.indexOf(port) + 1).forEach(function(visiblePort) {
      visiblePort.top(visiblePort.top() - port.height());
    });

    this.portListHeight(this.portListHeight() - port.height());
    this.portToggler(this, port);
  };

  Module.prototype.deselectOption = function() {
    if (!this.element())
      return;

    dom.value(this.portSelectElement(), '');
  };

  Module.prototype.sortOptGroup = function(type) {
    if (!this.element())
      return;

    var element = this.portOptGroupElement(type);
    helper.sortBy(dom.children(element), 'textContent').forEach(function(child) {
      dom.append(element, child);
    });
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
      this.draggable(new dom.Draggable({
        element: this.element(),
        onstart: Module.prototype.onstart.bind(this),
        onmove: Module.prototype.onmove.bind(this),
        onend: Module.prototype.onend.bind(this)
      }));
      dom.on(this.portSelectElement(), 'change', this.onchange);
      dom.on(this.element(), dom.eventType('start'), this.onpoint, true);
      this.redraw();
      dom.append(parentElement, this.element());
      return;
    }

    // remove element
    if (!parentElement && element) {
      this.draggable().destroy();
      dom.off(this.portSelectElement(), 'change', this.onchange);
      dom.off(this.element(), dom.eventType('start'), this.onpoint, true);

      var contentWindow = dom.contentWindow(this.componentElement());
      if (contentWindow)
        dom.off(contentWindow, dom.eventType('start'), this.onpoint, true);

      var eventCircuitElement = this.eventCircuitElement();
      if (eventCircuitElement) {
        var circuitElement = this.circuitElement();
        eventCircuitElement.getAll().forEach(function(member) {
          CircuitElement.unbind(circuitElement.get(member.props().name), member);
        });
      }

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

  Module.prototype.dragType = function(target) {
    if (target === this.titleElement())
      return 'position';
    else if (target === this.deleteButtonElement())
      return 'delete';
    else if (dom.hasClass(target, 'module-port-hide-button'))
      return 'hidePort';
    else if (dom.hasClass(target, 'module-port-label'))
      return 'sortPort';
    else if (dom.hasClass(target, 'module-port-plug'))
      return 'dragPortPlug';
    else if (dom.hasClass(dom.parent(target), 'module-port-socket'))
      return 'dragPortSocket';
    else
      return null;
  };

  Module.prototype.onstart = function(x, y, event) {
    var context = this.dragContext();
    var target = dom.target(event);
    var type = context.type = this.dragType(target);

    if (!type)
      return;

    dom.cancel(event);

    if (type === 'position') {
      context.x = this.x();
      context.y = this.y();
      dom.addClass(this.element(), 'module-moving');
    } else if (type === 'delete') {
      context.target = target;
      dom.addClass(this.element(), 'module-deleting');
    } else if (type === 'hidePort') {
      context.target = target;
      context.port = this.ports().filter(function(port) {
        return dom.contains(port.listItemElement(), target);
      })[0];
    } else if (type === 'sortPort') {
      var port = this.ports().filter(function(port) {
        return dom.contains(port.listItemElement(), target);
      })[0];
      var top = port.top();
      context.port = port;
      context.top = top;
      context.placeholderTop = top;
      dom.addClass(port.listItemElement(), 'module-port-sorting');
    } else if (type === 'dragPortPlug') {
      context.port = this.ports().filter(function(port) {
        return dom.contains(port.listItemElement(), target);
      })[0];
      context.context = {};
      this.dragPortPlugStarter(this, context.port, context.context);
    } else if (type === 'dragPortSocket') {
      context.port = this.ports().filter(function(port) {
        return dom.contains(port.listItemElement(), target);
      })[0];
      context.context = {};
      this.dragPortSocketStarter(this, context.port, context.context);
    }

    this.dragStarter();
  };

  Module.prototype.onmove = function(dx, dy) {
    var context = this.dragContext();
    var type = context.type;

    if (!type)
      return;

    if (type === 'position') {
      this.x(Math.max(context.x + dx, (this.hasVisiblePortSocket() ? ModulePort.SOCKET_WIDTH : 0)));
      this.y(Math.max(context.y + dy, 0));
    } else if (type === 'delete') {
      dom.toggleClass(this.element(), 'module-deleting', dom.target(event) === context.target);
    } else if (type === 'sortPort') {
      var targetPort = context.port;
      var targetPortHeight = targetPort.height();

      // move the target port within the port list
      var targetPortTop = Math.min(Math.max(context.top + dy, 0), this.portListHeight() - targetPortHeight);

      targetPort.top(targetPortTop);

      var targetPortCenter = targetPortTop + targetPortHeight / 2;
      var placeholderTop = context.placeholderTop;
      var nextPlaceholderTop = placeholderTop;
      var isDown = (targetPortTop - placeholderTop > 0);

      this.ports().forEach(function(port) {
        if (!port.visible() || port === targetPort)
          return;

        var top = port.top();
        var bottom = port.bottom();

        if (isDown && placeholderTop <= top && top < targetPortCenter) {
          // move up the ports over the target port
          port.top(top - targetPortHeight);
          nextPlaceholderTop = Math.max(nextPlaceholderTop, port.bottom());
        } else if (!isDown && targetPortCenter < bottom && bottom <= placeholderTop) {
          // move down the ports under the target port
          port.top(top + targetPortHeight);
          nextPlaceholderTop = Math.min(nextPlaceholderTop, top);
        }
      });

      context.placeholderTop = nextPlaceholderTop;
    } else if (type === 'dragPortPlug') {
      this.dragPortPlugMover(this, context.port, dx, dy, context.context);
    } else if (type === 'dragPortSocket') {
      this.dragPortSocketMover(this, context.port, dx, dy, context.context);
    }
  };

  Module.prototype.onend = function(dx, dy, event) {
    var context = this.dragContext();
    var type = context.type;
    var target = dom.target(event);

    if (!type)
      return;

    if (type === 'position') {
      dom.removeClass(this.element(), 'module-moving');
    } else if (type === 'delete') {
      if (target === context.target) {
        // remove all connections of connected ports
        this.ports().forEach(function(port) {
          this.hidePort(port.name());
        }.bind(this));
        this.parentElement(null);
        this.deleter(this);
      } else {
        dom.removeClass(this.element(), 'module-deleting');
      }
    } else if (type === 'hidePort') {
      if (target === context.target)
        this.hidePort(context.port.name());
    } else if (type === 'sortPort') {
      var port = context.port;
      port.top(context.placeholderTop);
      dom.removeClass(port.listItemElement(), 'module-port-sorting');
    } else if (type === 'dragPortPlug') {
      this.dragPortPlugEnder(this, context.port, context.context);
    } else if (type === 'dragPortSocket') {
      this.dragPortSocketEnder(this, context.port, context.context);
    }

    this.dragEnder();
  };

  Module.prototype.onchange = function(event) {
    this.showPort(dom.value(dom.target(event)));
    this.deselectOption();
    dom.removeFocus();
  };

  Module.prototype.onpoint = function() {
    this.fronter(this);
  };

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
