(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var Unit = function(props) {
    this.module = props.module;
    this.port = props.port;
  };

  Unit.prototype.contains = function(component) {
    return (this.module === component || this.port === component);
  };

  Unit.prototype.name = function() {
    return this.port.name();
  };

  Unit.prototype.type = function() {
    return this.port.type();
  };

  Unit.prototype.plugDisabled = function() {
    return this.port.plugDisabled();
  };

  Unit.prototype.socketDisabled = function() {
    return this.port.socketDisabled();
  };

  Unit.prototype.visible = function() {
    return this.port.visible();
  };

  Unit.prototype.highlighted = function(value) {
    this.port.highlighted(value);

    // module is deletable if all ports are NOT highlighted
    this.module.deletable(!this.module.hasHighlightedPort());
  };

  Unit.prototype.plugHighlighted = function(value) {
    return this.port.plugHighlighted(value);
  };

  Unit.prototype.socketHighlighted = function(value) {
    return this.port.socketHighlighted(value);
  };

  Unit.prototype.socketConnected = function(value) {
    return this.port.socketConnected(value);
  };

  Unit.prototype.circuitModuleMember = function() {
    return this.module.circuitModuleMember(this.port.name());
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Unit;
  } else {
    app.Unit = Unit;
  }
})(this.app || (this.app = {}));
