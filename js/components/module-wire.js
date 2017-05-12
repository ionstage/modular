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
    this.parentElement = this.prop(props.parentElement);
    this.handleElement = this.prop(null);
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

  ModuleWire.prototype.renderHandle = function() {
    var element = dom.el('<div>');
    dom.addClass(element, 'module-wire-handle');
    return element;
  };

  ModuleWire.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element) {
      return;
    }

    // add element
    if (parentElement && !element) {
      this.element(dom.render(ModuleWire.TEMPLATE_HTML));
      this.handleElement(this.renderHandle());
      this.redraw();
      dom.append(parentElement, this.element());
      dom.append(this.parentHandleElement(), this.handleElement());
      return;
    }

    // remove element
    if (!parentElement && element) {
      dom.remove(element);
      dom.remove(this.handleElement());
      this.element(null);
      this.handleElement(null);
      this.clearCache();
      return;
    }

    // update element
    this.redrawPath();
    this.redrawHandle();
    this.redrawHighlight();
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
