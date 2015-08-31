(function(app) {
  'use strict';
  var m = require('mithril');

  var ConnectorHandle = function() {
    this.type = m.prop('');
    this.x = propWithCache(0);
    this.y = propWithCache(0);
    this.visible = propWithCache(false);
    this.element = m.prop(null);
  };

  ConnectorHandle.prototype.redraw = function() {
    var element = this.element();

    if (this.x.dirty || this.y.dirty) {
      dom.translate(element, this.x(), this.y());
      this.x.dirty = false;
      this.y.dirty = false;
    }

    if (this.visible.dirty) {
      if (this.visible())
        dom.removeClass(element, 'hide');
      else
        dom.addClass(element, 'hide');
      this.visible.dirty = false;
    }
  };

  var propWithCache = function(initialValue) {
    var cache = initialValue;
    var propFunc = function(value) {
      if (typeof value === 'undefined')
        return cache;
      if (cache === value)
        return;
      cache = value;
      propFunc.dirty = true;
    };
    propFunc.dirty = false;
    return propFunc;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ConnectorHandle;
  else
    app.ConnectorHandle = ConnectorHandle;
})(this.app || (this.app = {}));