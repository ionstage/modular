(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var Wire = jCore.Component.inherits(function(props) {
    this.sourceX = this.prop(props.sourceX);
    this.sourceY = this.prop(props.sourceY);
    this.targetX = this.prop(props.targetX);
    this.targetY = this.prop(props.targetY);
    this.handleType = this.prop(props.handleType);
    this.handleVisible = this.prop(props.handleVisible);
    this.highlighted = this.prop(false);
    this.parentHandleElement = this.prop(props.parentHandleElement);
    this.handle = new Wire.Handle();
  });

  Wire.prototype.pathElement = function() {
    return this.findElement('path');
  };

  Wire.prototype.render = function() {
    return dom.render(Wire.HTML_TEXT);
  };

  Wire.prototype.oninit = function() {
    this.handle.type(this.handleType());
    this.handle.visible(this.handleVisible());
    this.addRelation(new Wire.Relation({
      wire: this,
      handle: this.handle,
    }));
  };

  Wire.prototype.onappend = function() {
    this.handle.parentElement(this.parentHandleElement());
    this.handle.redraw();
  };

  Wire.prototype.onremove = function() {
    this.handle.parentElement(null);
    this.handle.redraw();
  };

  Wire.prototype.onredraw = function() {
    this.redrawBy('sourceX', 'sourceY', 'targetX', 'targetY', function(sourceX, sourceY, targetX, targetY) {
      var x = Math.min(sourceX, targetX);
      var y = Math.min(sourceY, targetY);
      var d = ['M', sourceX - x, sourceY - y, 'L', targetX - x, targetY - y].join(' ');
      dom.translate(this.element(), x, y);
      dom.attr(this.pathElement(), { d: d });
    });

    this.redrawBy('highlighted', function(highlighted) {
      dom.className(this.pathElement(), 'wire-path' + (highlighted ? ' highlighted' : ''));
    });
  };

  Wire.HTML_TEXT = [
    '<svg class="wire">',
      '<path class="wire-path"></path>',
    '</svg>',
  ].join('');

  Wire.Handle = (function() {
    var Handle = jCore.Component.inherits(function() {
      this.x = this.prop(0);
      this.y = this.prop(0);
      this.type = this.prop('prop');
      this.visible = this.prop(false);
      this.highlighted = this.prop(false);
      this.width = this.prop(24);
    });

    Handle.prototype.render = function() {
      return dom.render(Handle.HTML_TEXT);
    };

    Handle.prototype.onredraw = function() {
      this.redrawBy('x', 'y', function(x, y) {
        dom.translate(this.element(), x, y);
      });

      this.redrawBy('type', function(type) {
        dom.data(this.element(), 'type', type);
      });

      this.redrawBy('visible', function(visible) {
        dom.toggleClass(this.element(), 'hide', !visible);
      });

      this.redrawBy('highlighted', function(highlighted) {
        dom.toggleClass(this.element(), 'highlighted', highlighted);
      });
    };

    Handle.HTML_TEXT = '<div class="wire-handle"></div>';

    return Handle;
  })();

  Wire.Relation = (function() {
    var Relation = jCore.Relation.inherits(function(props) {
      this.wire = props.wire;
      this.handle = props.handle;
    });

    Relation.prototype.update = function() {
      this.handle.x(this.wire.targetX() - this.handle.width() / 2);
      this.handle.y(this.wire.targetY() - this.handle.width() / 2);
      this.handle.visible(this.wire.handleVisible());
      this.handle.highlighted(this.wire.highlighted());
    };

    return Relation;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Wire;
  } else {
    app.Wire = Wire;
  }
})(this.app || (this.app = {}));