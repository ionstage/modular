(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var Wire = jCore.Component.inherits(function(_, props) {
    this.sourceX = this.prop(props.sourceX);
    this.sourceY = this.prop(props.sourceY);
    this.targetX = this.prop(props.targetX);
    this.targetY = this.prop(props.targetY);
    this.highlighted = this.prop(props.highlighted);
  });

  Wire.prototype.pathElement = function() {
    return dom.find(this.el, 'path');
  };

  Wire.prototype.render = function() {
    return dom.render(Wire.HTML_TEXT);
  };

  Wire.prototype.onredraw = function() {
    this.redrawBy('sourceX', 'sourceY', 'targetX', 'targetY', function(sourceX, sourceY, targetX, targetY) {
      var x = Math.min(sourceX, targetX);
      var y = Math.min(sourceY, targetY);
      var d = ['M', sourceX - x, sourceY - y, 'L', targetX - x, targetY - y].join(' ');
      dom.translate(this.el, x, y);
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Wire;
  } else {
    app.Wire = Wire;
  }
})(this.app || (this.app = {}));
