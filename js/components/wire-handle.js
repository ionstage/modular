(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var WireHandle = jCore.Component.inherits(function(props) {
    this.cx = this.prop(props.cx);
    this.cy = this.prop(props.cy);
    this.type = this.prop(props.type);
    this.visible = this.prop(props.visible);
    this.highlighted = this.prop(props.highlighted);
    this.width = this.prop(24);
    this.port = props.port;
  });

  WireHandle.prototype.render = function() {
    return dom.render(WireHandle.HTML_TEXT);
  };

  WireHandle.prototype.onredraw = function() {
    this.redrawBy('cx', 'cy', function(cx, cy) {
      dom.translate(this.element(), cx - this.width() / 2, cy - this.width() / 2);
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

  WireHandle.HTML_TEXT = '<div class="wire-handle"></div>';

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WireHandle;
  } else {
    app.WireHandle = WireHandle;
  }
})(this.app || (this.app = {}));
