(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Module = helper.inherits(function(props) {
    Module.super_.call(this);

    this.title = this.prop(props.title);
    this.x = this.prop(props.x);
    this.y = this.prop(props.y);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
    this.dragContext = this.prop({});
  }, jCore.Component);

  Module.prototype.titleElement = function() {
    return dom.child(this.element(), 0, 0);
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
      dom.draggable(element, this.onstart.bind(this), this.onmove.bind(this));
      this.element(element);
      this.redraw();
      dom.append(parentElement, element);
      return;
    }

    // remove element
    if (!parentElement && element) {
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

    if (dom.target(event) === this.titleElement())
      context.type = 'position';
    else
      context.type = null;

    var type = context.type;

    if (!type)
      return;

    dom.cancel(event);

    if (type === 'position') {
      context.x = this.x();
      context.y = this.y();
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
