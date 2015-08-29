(function(app) {
  'use strict';
  var m = require('mithril');

  var Port = function(option) {
    this.id = m.prop('');
    this.type = m.prop(option.type);
    this.key = m.prop(option.key);
    this.contentText = m.prop(option.contentText);
    this.hasIn = m.prop(option.hasIn);
    this.hasOut = m.prop(option.hasOut);
    this.isDefault = m.prop(option.isDefault);
    this.isShowing = m.prop(option.isDefault);
    this.element = m.prop(null);
  };

  Port.prototype.initializeElement = function(element) {
    this.element(element);
    dom.addClass(element, this.type());
    if (!this.hasIn())
      dom.addClass(element, 'hide-connector-in');
    if (!this.hasOut())
      dom.addClass(element, 'hide-connector-out');
  };

  Port.prototype.show = function() {
    this.isShowing(true);
  };

  Port.prototype.hide = function() {
    this.isShowing(false);
  };

  Port.prototype.showConnectorConnected = function() {
    dom.removeClass(this.element(), 'hide-connector-connected');
  };

  Port.prototype.hideConnectorConnected = function() {
    dom.addClass(this.element(), 'hide-connector-connected');
  };

  Port.prototype.getOutConnectorElement = function() {
    var element = this.element();
    if (!element)
      return null;
    return element.children[0].children[2];
  };

  Port.prototype.getInConnectorElement = function() {
    var element = this.element();
    if (!element)
      return null;
    return element.children[0].children[0];
  };

  Port.prototype.setFlushInConnector = function(flag) {
    var element = this.element();
    if (flag)
      dom.addClass(element, 'flush-connector-in');
    else
      dom.removeClass(element, 'flush-connector-in');
  };

  Port.prototype.setFlushConnectorConnected = function(flag) {
    var element = this.element();
    if (flag)
      dom.addClass(element, 'flush-connector-connected');
    else
      dom.removeClass(element, 'flush-connector-connected');
  };

  Port.prototype.setFlushOutConnector = function(flag) {
    var element = this.element();
    if (flag)
      dom.addClass(element, 'flush-connector-out');
    else
      dom.removeClass(element, 'flush-connector-out');
  };

  Port.prototype.mark = function() {
    dom.addClass(this.element(), 'mark');
  };

  Port.prototype.clearMark = function() {
    dom.removeClass(this.element(), 'mark');
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Port;
  else
    app.Port = Port;
})(this.app || (this.app = {}));