(function(app) {
  'use strict';

  var ConnectorHandle = function(element) {
    this.element = prop(element);
    this.x = prop(0);
    this.y = prop(0);
    this.type = prop('');
    this.visible = prop(false);
  };

  ConnectorHandle.prototype.update = function() {
    var element = this.element();

    if (this.x.dirty || this.y.dirty) {
      dom.translate(element, this.x(), this.y());
      this.x.dirty = false;
      this.y.dirty = false;
    }

    if (this.type.dirty) {
      var type = this.type();
      var preType = this.type.preValue;
      if (preType && type !== preType)
        dom.removeClass(element, preType);
      dom.addClass(element, type);
      this.type.dirty = false;
    }

    if (this.visible.dirty) {
      if (this.visible())
        dom.removeClass(element, 'hide');
      else
        dom.addClass(element, 'hide');
      this.visible.dirty = false;
    }
  };

  var prop = function(initialValue) {
    var cache = initialValue;
    var propFunc = function(value) {
      if (typeof value === 'undefined')
        return cache;
      if (cache === value)
        return;
      propFunc.preValue = cache;
      cache = value;
      propFunc.dirty = true;
    };
    propFunc.preValue = null;
    propFunc.dirty = false;
    return propFunc;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ConnectorHandle;
  else
    app.ConnectorHandle = ConnectorHandle;
})(this.app || (this.app = {}));