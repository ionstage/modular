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
    this.connectorType = this.prop(props.connectorType);
    this.connectorVisible = this.prop(!!props.connectorVisible);
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
    this.cache = this.prop({});
  }, jCore.Component);

  ModuleWire.prototype.pathElement = function() {
    // use 'dom.childNode' method for SVGElement
    return dom.childNode(this.element(), 0, 0);
  };

  ModuleWire.prototype.connectorElement = function() {
    return dom.childNode(this.element(), 1);
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
    this.redrawPath();
    this.redrawConnector();
  };

  ModuleWire.prototype.redrawPath = function() {
    var sourceX = this.sourceX();
    var sourceY = this.sourceY();
    var targetX = this.targetX();
    var targetY = this.targetY();
    var cache = this.cache();

    if (sourceX === cache.sourceX && sourceY === cache.sourceY &&
        targetX === cache.targetX && targetY === cache.targetY) {
      return;
    }

    var x = Math.min(sourceX, targetX);
    var y = Math.min(sourceY, targetY);

    var translate = 'translate(' + x + 'px, ' + y + 'px)';

    var d = [
      'M', sourceX - x, sourceY - y,
      'L', targetX - x, targetY - y
    ].join(' ');

    dom.css(this.element(), {
      transform: translate,
      webkitTransform: translate
    });

    dom.attr(this.pathElement(), { d: d });

    cache.sourceX = sourceX;
    cache.sourceY = sourceY;
    cache.targetX = targetX;
    cache.targetY = targetY;

    // for update of the connector
    cache.x = x;
    cache.y = y;
  };

  ModuleWire.prototype.redrawConnector = function() {
    var type = this.connectorType();
    var visible = this.connectorVisible();
    var element = this.connectorElement();
    var cache = this.cache();

    if (cache.connectorType !== type) {
      dom.data(element, 'type', type);
      cache.connectorType = type;
    }

    if (cache.connectorVisible !== visible) {
      dom.toggleClass(element, 'hide', !visible);
      cache.connectorVisible = visible;
    }

    if (!visible)
      return;

    var x = cache.targetX - cache.x - ModuleWire.CONNECTOR_WIDTH / 2;
    var y = cache.targetY - cache.y - ModuleWire.CONNECTOR_WIDTH / 2;

    var translate = 'translate(' + x + 'px, ' + y + 'px)';

    dom.css(element, {
      transform: translate,
      webkitTransform: translate
    });
  };

  ModuleWire.TEMPLATE_HTML = [
    '<svg class="module-wire-path-container">',
      '<path class="module-wire-path"></path>',
    '</svg>',
    '<div class="module-wire-connector"></div>'
  ].join('');

  ModuleWire.CONNECTOR_WIDTH = 24;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleWire;
  else
    app.ModuleWire = ModuleWire;
})(this.app || (this.app = {}));
