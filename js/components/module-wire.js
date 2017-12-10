(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var ModuleWire = jCore.Component.inherits(function(props) {
    this.sourceX = this.prop(props.sourceX);
    this.sourceY = this.prop(props.sourceY);
    this.targetX = this.prop(props.targetX);
    this.targetY = this.prop(props.targetY);
    this.handleType = this.prop(props.handleType);
    this.handleVisible = this.prop(props.handleVisible);
    this.handleWidth = this.prop(24);
    this.highlighted = this.prop(false);
    this.handleElement = this.prop(this.renderHandle());
    this.parentHandleElement = this.prop(props.parentHandleElement);
  });

  ModuleWire.prototype.pathElement = function() {
    // use 'dom.childNode' method for SVGElement
    return dom.childNode(this.element(), 0);
  };

  ModuleWire.prototype.handleX = function() {
    return this.targetX() - this.handleWidth() / 2;
  };

  ModuleWire.prototype.handleY = function() {
    return this.targetY() - this.handleWidth() / 2;
  };

  ModuleWire.prototype.render = function() {
    return dom.render(ModuleWire.HTML_TEXT);
  };

  ModuleWire.prototype.renderHandle = function() {
    return dom.render(ModuleWire.HANDLE_HTML_TEXT);
  };

  ModuleWire.prototype.redrawPath = function() {
    this.redrawBy('sourceX', 'sourceY', 'targetX', 'targetY', function(sourceX, sourceY, targetX, targetY) {
      var x = Math.min(sourceX, targetX);
      var y = Math.min(sourceY, targetY);

      dom.translate(this.element(), x, y);

      dom.attr(this.pathElement(), {
        d: ['M', sourceX - x, sourceY - y, 'L', targetX - x, targetY - y].join(' '),
      });
    });
  };

  ModuleWire.prototype.redrawHandle = function() {
    this.redrawBy('handleType', function(handleType) {
      dom.data(this.handleElement(), 'type', handleType);
    });

    this.redrawBy('handleVisible', function(handleVisible) {
      dom.toggleClass(this.handleElement(), 'hide', !handleVisible);
    });

    this.redrawBy('handleX', 'handleY', function(handleX, handleY) {
      dom.translate(this.handleElement(), handleX, handleY);
    });
  };

  ModuleWire.prototype.redrawHighlight = function() {
    this.redrawBy('highlighted', function(highlighted) {
      dom.className(this.pathElement(), 'module-wire-path' + (highlighted ? ' highlighted' : ''));
      dom.toggleClass(this.handleElement(), 'highlighted', highlighted);
    });
  };

  ModuleWire.prototype.onappend = function() {
    dom.append(this.parentHandleElement(), this.handleElement());
  };

  ModuleWire.prototype.onremove = function() {
    dom.remove(this.handleElement());
    this.handleElement(null);
  };

  ModuleWire.prototype.onredraw = function() {
    this.redrawPath();
    this.redrawHandle();
    this.redrawHighlight();
  };

  ModuleWire.HTML_TEXT = [
    '<svg class="module-wire">',
      '<path class="module-wire-path"></path>',
    '</svg>',
  ].join('');

  ModuleWire.HANDLE_HTML_TEXT = '<div class="module-wire-handle"></div>';

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleWire;
  } else {
    app.ModuleWire = ModuleWire;
  }
})(this.app || (this.app = {}));
