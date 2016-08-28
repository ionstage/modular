(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var ModuleWire = helper.inherits(function(props) {
    ModuleWire.super_.call(this);

    this.sourceX = this.prop(props.sourceX);
    this.sourceY = this.prop(props.sourceY);
    this.targetX = this.prop(props.targetX);
    this.targetY = this.prop(props.targetY);
    this.handleType = this.prop(props.handleType);
    this.handleVisible = this.prop(!!props.handleVisible);
    this.highlighted = this.prop(false);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.handleElement = this.prop(null);
    this.parentHandleElement = this.prop(props.parentHandleElement);
    this.cache = this.prop({});
  }, jCore.Component);

  ModuleWire.prototype.pathElement = function() {
    // use 'dom.childNode' method for SVGElement
    return dom.childNode(this.element(), 0, 0);
  };

  ModuleWire.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element)
      return;

    // add element
    if (parentElement && !element) {
      element = dom.el('<div>');
      dom.addClass(element, 'module-wire');
      dom.html(element, ModuleWire.TEMPLATE_HTML);
      var handleElement = dom.el('<div>');
      dom.addClass(handleElement, 'module-wire-handle');
      this.element(element);
      this.handleElement(handleElement);
      this.redraw();
      dom.append(parentElement, element);
      dom.append(this.parentHandleElement(), handleElement);
      return;
    }

    // remove element
    if (!parentElement && element) {
      dom.remove(element);
      dom.remove(this.handleElement());
      this.element(null);
      this.handleElement(null);
      this.cache({});
      return;
    }

    // update element
    this.redrawPath();
    this.redrawHandle();
  };

  ModuleWire.prototype.redrawPath = function() {
    var cache = this.cache();

    var highlighted = this.highlighted();
    if (highlighted !== cache.highlighted) {
      dom.toggleClass(this.element(), 'module-wire-highlight', highlighted);
      // update cache in 'redrawHandle' method
    }

    var sourceX = this.sourceX();
    var sourceY = this.sourceY();
    var targetX = this.targetX();
    var targetY = this.targetY();

    if (sourceX === cache.sourceX && sourceY === cache.sourceY &&
        targetX === cache.targetX && targetY === cache.targetY) {
      return;
    }

    var x = Math.min(sourceX, targetX);
    var y = Math.min(sourceY, targetY);
    var translate = 'translate(' + x + 'px, ' + y + 'px)';

    dom.css(this.element(), {
      transform: translate,
      webkitTransform: translate
    });

    dom.attr(this.pathElement(), {
      d: ['M', sourceX - x, sourceY - y, 'L', targetX - x, targetY - y].join(' ')
    });

    cache.sourceX = sourceX;
    cache.sourceY = sourceY;
    cache.targetX = targetX;
    cache.targetY = targetY;
  };

  ModuleWire.prototype.redrawHandle = function() {
    var cache = this.cache();

    var handleType = this.handleType();
    if (handleType !== cache.handleType) {
      dom.data(this.handleElement(), 'type', handleType);
      cache.handleType = handleType;
    }

    var handleVisible = this.handleVisible();
    if (handleVisible !== cache.handleVisible) {
      dom.toggleClass(this.handleElement(), 'hide', !handleVisible);
      cache.handleVisible = handleVisible;
    }

    var highlighted = this.highlighted();
    if (highlighted !== cache.highlighted) {
      dom.toggleClass(this.handleElement(), 'module-wire-highlight', highlighted);
      cache.highlighted = highlighted;
    }

    var x = cache.targetX - ModuleWire.HANDLE_WIDTH / 2;
    var y = cache.targetY - ModuleWire.HANDLE_WIDTH / 2;

    if (x !== cache.x || y !== cache.y) {
      var translate = 'translate(' + x + 'px, ' + y + 'px)';
      dom.css(this.handleElement(), {
        transform: translate,
        webkitTransform: translate
      });
      cache.x = x;
      cache.y = y;
    }
  };

  ModuleWire.TEMPLATE_HTML = [
    '<svg class="module-wire-path-container">',
      '<path class="module-wire-path"></path>',
    '</svg>'
  ].join('');

  ModuleWire.HANDLE_WIDTH = 24;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleWire;
  else
    app.ModuleWire = ModuleWire;
})(this.app || (this.app = {}));
