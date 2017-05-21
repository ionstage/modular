(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var ModuleWire = Component.inherits(function(props) {
    this.sourceX = this.prop(props.sourceX);
    this.sourceY = this.prop(props.sourceY);
    this.targetX = this.prop(props.targetX);
    this.targetY = this.prop(props.targetY);
    this.handleType = this.prop(props.handleType);
    this.handleVisible = this.prop(props.handleVisible);
    this.highlighted = this.prop(false);
    this.handleElement = this.prop(this.renderHandle());
    this.parentHandleElement = this.prop(props.parentHandleElement);
  });

  ModuleWire.prototype.pathElement = function() {
    // use 'dom.childNode' method for SVGElement
    return dom.childNode(this.element(), 0);
  };

  ModuleWire.prototype.handlePosition = function() {
    return new dom.Point({
      x: this.targetX() - ModuleWire.HANDLE_WIDTH / 2,
      y: this.targetY() - ModuleWire.HANDLE_WIDTH / 2,
    });
  };

  ModuleWire.prototype.render = function() {
    return dom.render(ModuleWire.TEMPLATE_HTML);
  };

  ModuleWire.prototype.renderHandle = function() {
    var element = dom.el('<div>');
    dom.addClass(element, 'module-wire-handle');
    return element;
  };

  ModuleWire.prototype.redrawPath = function() {
    this.redrawProp('sourceX', 'sourceY', 'targetX', 'targetY', function(sourceX, sourceY, targetX, targetY) {
      var x = Math.min(sourceX, targetX);
      var y = Math.min(sourceY, targetY);

      dom.translate(this.element(), x, y);

      dom.attr(this.pathElement(), {
        d: ['M', sourceX - x, sourceY - y, 'L', targetX - x, targetY - y].join(' '),
      });
    });
  };

  ModuleWire.prototype.redrawHandle = function() {
    this.redrawProp('handleType', function(handleType) {
      dom.data(this.handleElement(), 'type', handleType);
    });

    this.redrawProp('handleVisible', function(handleVisible) {
      dom.toggleClass(this.handleElement(), 'hide', !handleVisible);
    });

    this.redrawProp('handlePosition', function(handlePosition) {
      dom.translate(this.handleElement(), handlePosition.x, handlePosition.y);
    });
  };

  ModuleWire.prototype.redrawHighlight = function() {
    this.redrawProp('highlighted', function(highlighted) {
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

  ModuleWire.HANDLE_WIDTH = 24;

  ModuleWire.TEMPLATE_HTML = [
    '<svg class="module-wire">',
      '<path class="module-wire-path"></path>',
    '</svg>',
  ].join('');

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleWire;
  } else {
    app.ModuleWire = ModuleWire;
  }
})(this.app || (this.app = {}));
