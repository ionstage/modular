(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Module = helper.inherits(function(props) {
    Module.super_.call(this);

    this.title = this.prop(props.title);
    this.name = this.prop(props.name);
    this.x = this.prop(props.x);
    this.y = this.prop(props.y);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
    this.draggable = this.prop(null);
    this.dragContext = this.prop({});
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

              resolve();
            } catch(e) {
              reject(e);
            }
          };

          dom.on(contentWindow, 'message', onmessage);
        }),
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
    }.bind(this));
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
      this.draggable(dom.draggable(element, this.onstart.bind(this), this.onmove.bind(this), this.onend.bind(this)));
      this.element(element);
      this.redraw();
      dom.append(parentElement, element);
      return;
    }

    // remove element
    if (!parentElement && element) {
      this.draggable().destroy();
      dom.remove(element);
      this.element(null);
      this.cache({});
      return;
    }

    // update element
    this.redrawTitle();
    this.redrawPosition();
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

  Module.prototype.onstart = function(x, y, event) {
    var context = this.dragContext();
    var target = dom.target(event);

    if (target === this.titleElement())
      context.type = 'position';
    else if (target === this.deleteButtonElement())
      context.type = 'delete';
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
      dom.addClass(this.element(), 'module-deleting');
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
      if (dom.target(event) === this.deleteButtonElement())
        dom.addClass(this.element(), 'module-deleting');
      else
        dom.removeClass(this.element(), 'module-deleting');
    }
  };

  Module.prototype.onend = function(dx, dy, event) {
    var type = this.dragContext().type;
    var target = dom.target(event);

    if (!type)
      return;

    if (type === 'position') {
      dom.removeClass(this.element(), 'module-dragging');
    } else if (type === 'delete') {
      if (target === this.deleteButtonElement())
        this.parentElement(null);
      else
        dom.removeClass(this.element(), 'module-deleting');
    }
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
