(function(app) {
  'use strict';

  var ConnectorHandle = function(element) {
    this._element = element;
    this._x = 0;
    this._y = 0;
    this._type = '';
    this._isShowing = false;
    this._needsUpdateShowing = false;
  };

  ConnectorHandle.prototype.show = function() {
    this._isShowing = true;
    this._needsUpdateShowing = true;
  };

  ConnectorHandle.prototype.hide = function() {
    this._isShowing = false;
    this._needsUpdateShowing = true;
  };

  ConnectorHandle.prototype.update = function() {
    dom.translate(this._element, this._x, this._y);
    if (this._needsUpdateShowing) {
      if (this._isShowing)
        dom.removeClass(this._element, 'hide');
      else
        dom.addClass(this._element, 'hide');
      this._needsUpdateShowing = false;
    }
  };

  ConnectorHandle.prototype.position = function(point) {
    this._x = point.x;
    this._y = point.y;
  };

  ConnectorHandle.prototype.type = function(value) {
    var element = this._element;
    var currentType = this._type;
    if (currentType)
      dom.removeClass(element, currentType);
    dom.addClass(element, value);
    this._type = value;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ConnectorHandle;
  else
    app.ConnectorHandle = ConnectorHandle;
})(this.app || (this.app = {}));