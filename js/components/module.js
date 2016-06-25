(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var ModulePort = app.ModulePort || require('./module-port.js');

  var Module = helper.inherits(function(props) {
    Module.super_.call(this);

    this.title = this.prop(props.title);
    this.name = this.prop(props.name);
    this.x = this.prop(props.x);
    this.y = this.prop(props.y);
    this.ports = this.prop([]);
    this.portListHeight = this.prop(0);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
    this.draggable = this.prop(null);
    this.dragContext = this.prop({});

    this.onchange = Module.prototype.onchange.bind(this);

    this.optionDeselector = Module.prototype.deselectOption.bind(this);
    this.optGroupSorter = Module.prototype.sortOptGroup.bind(this);

    this.deleter = props.deleter;
  }, jCore.Component);

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

  Module.prototype.loadComponent = function() {
    var url = [
      'modular_modules/',
      this.name().split('/').map(function(s) {
        return encodeURIComponent(s);
      }).join('/'),
      '.html'
    ].join('');

    dom.addClass(this.element(), 'module-loading');

    return dom.ajax({
      type: 'GET',
      url: url
    }).then(function(text) {
      var componentElement = this.componentElement();
      var contentWindow = dom.contentWindow(componentElement);
      var data = Date.now().toString();

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

              this.ports(circuitElement.getAll().map(function(member) {
                var props = member.props();
                props.parentListElement = this.portListElement();
                props.parentOptGroupElement = this.portOptGroupElement(props.type);
                props.optionDeselector = this.optionDeselector;
                props.optGroupSorter = this.optGroupSorter;
                return new ModulePort(props);
              }.bind(this)));

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
    var port = this.ports().filter(function(port) {
      return port.name() === name;
    })[0];

    if (!port || port.visible())
      return;

    // add the port to the end of the list
    var portListHeight = this.portListHeight();
    this.portListHeight(portListHeight + port.height());
    port.top(portListHeight);
    port.visible(true);
  };

  Module.prototype.hidePort = function(name) {
    var visiblePorts = this.ports().slice().filter(function(port) {
      return port.visible();
    }).sort(function(a, b) {
      return a.top() - b.top();
    });

    var hiddenPort = null;

    visiblePorts.forEach(function(port) {
      if (hiddenPort) {
        // move up the ports below the hidden port
        port.top(port.top() - hiddenPort.height());
      } else if (port.name() === name) {
        port.visible(false);
        hiddenPort = port;
      }
    });

    if (hiddenPort)
      this.portListHeight(this.portListHeight() - hiddenPort.height());
  };

  Module.prototype.deselectOption = function() {
    dom.value(this.portSelectElement(), '');
  };

  Module.prototype.sortOptGroup = function(type) {
    var element = this.portOptGroupElement(type);

    helper.sortBy(dom.children(element), 'textContent').forEach(function(child) {
      dom.append(element, child);
    });
  };

  Module.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element)
      return;

    // add element
    if (parentElement && !element) {
      element = dom.el('<div>');
      dom.addClass(element, 'module');
      dom.html(element, Module.TEMPLATE_HTML);
      this.draggable(new dom.Draggable({
        element: element,
        onstart: Module.prototype.onstart.bind(this),
        onmove: Module.prototype.onmove.bind(this),
        onend: Module.prototype.onend.bind(this)
      }));
      this.element(element);
      dom.on(this.portSelectElement(), 'change', this.onchange);
      this.redraw();
      dom.append(parentElement, element);
      return;
    }

    // remove element
    if (!parentElement && element) {
      this.draggable().destroy();
      dom.off(this.portSelectElement(), 'change', this.onchange);
      dom.remove(element);
      this.element(null);
      this.cache({});
      this.dragContext({});
      return;
    }

    // update element
    this.redrawTitle();
    this.redrawPosition();
    this.redrawPortList();
    this.redrawPortSelect();
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

  Module.prototype.redrawPortList = function() {
    var portListHeight = this.portListHeight();
    var cache = this.cache();

    if (portListHeight === cache.portListHeight)
      return;

    dom.css(this.portListElement(), {
      height: portListHeight + 'px'
    });

    cache.portListHeight = portListHeight;
  };

  Module.prototype.redrawPortSelect = function() {
    var cache = this.cache();

    var isAllPortsVisible = this.ports().every(function(port) {
      return port.visible();
    });

    if (isAllPortsVisible === cache.isAllPortsVisible)
      return;

    if (isAllPortsVisible)
      dom.addClass(this.element(), 'module-all-ports-visible');
    else
      dom.removeClass(this.element(), 'module-all-ports-visible');
  };

  Module.prototype.onstart = function(x, y, event) {
    var context = this.dragContext();
    var target = dom.target(event);

    if (target === this.titleElement())
      context.type = 'position';
    else if (target === this.deleteButtonElement())
      context.type = 'delete';
    else if (dom.hasClass(target, 'module-port-hide-button'))
      context.type = 'hidePort';
    else if (dom.hasClass(target, 'module-port-label'))
      context.type = 'sortPort';
    else
      context.type = null;

    var type = context.type;

    if (!type)
      return;

    dom.cancel(event);

    if (type === 'position') {
      context.x = this.x();
      context.y = this.y();
      dom.addClass(this.element(), 'module-dragging');
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
      dom.addClass(this.element(), 'module-port-sorting');
    }
  };

  Module.prototype.onmove = function(dx, dy) {
    var context = this.dragContext();
    var type = context.type;

    if (!type)
      return;

    if (type === 'position') {
      this.x(context.x + dx);
      this.y(context.y + dy);
    } else if (type === 'delete') {
      if (dom.target(event) === context.target)
        dom.addClass(this.element(), 'module-deleting');
      else
        dom.removeClass(this.element(), 'module-deleting');
    } else if (type === 'sortPort') {
      var targetPort = context.port;
      var targetPortHeight = targetPort.height();

      // move within the port list
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

        if (isDown) {
          if (placeholderTop <= top && top < targetPortCenter) {
            port.top(top - targetPortHeight);

            var bottom = port.bottom();
            if (nextPlaceholderTop < bottom)
              nextPlaceholderTop = bottom;
          }
        } else {
          var bottom = port.bottom();
          if (targetPortCenter < bottom && bottom <= placeholderTop) {
            port.top(top + targetPortHeight);

            if (nextPlaceholderTop > top)
              nextPlaceholderTop = top;
          }
        }
      });

      context.placeholderTop = nextPlaceholderTop;
    }
  };

  Module.prototype.onend = function(dx, dy, event) {
    var context = this.dragContext();
    var type = context.type;
    var target = dom.target(event);

    if (!type)
      return;

    if (type === 'position') {
      dom.removeClass(this.element(), 'module-dragging');
    } else if (type === 'delete') {
      if (target === context.target) {
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
      dom.removeClass(this.element(), 'module-port-sorting');
    }
  };

  Module.prototype.onchange = function(event) {
    this.showPort(dom.value(dom.target(event)));
    this.deselectOption();
    dom.removeFocus();
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
