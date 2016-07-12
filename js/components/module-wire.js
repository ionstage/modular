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
    this.element = this.prop(null);
    this.parentElement = this.prop(null);
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
      dom.html(element, '<svg><path></path></svg>');
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
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleWire;
  else
    app.ModuleWire = ModuleWire;
})(this.app || (this.app = {}));
