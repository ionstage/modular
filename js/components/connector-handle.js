(function(app) {
  'use strict';

  var ConnectorHandle = function(element) {
    this._element = element;
    this._x = 0;
    this._y = 0;
    this._type = '';
  };

  ConnectorHandle.prototype.show = function() {
    dom.removeClass(this._element, 'hide');
  };

  ConnectorHandle.prototype.hide = function() {
    dom.addClass(this._element, 'hide');
  };

  ConnectorHandle.prototype.update = function() {
    dom.translate(this._element, this._x, this._y);
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