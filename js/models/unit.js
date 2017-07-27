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

  Unit.prototype.plugPosition = function() {
    return this.module.plugPosition(this.port);
  };

  Unit.prototype.socketPosition = function() {
    return this.module.socketPosition(this.port);
  };

  Unit.prototype.addRelation = function(relation) {
    this.module.addRelation(relation);
    this.port.addRelation(relation);
  };

  Unit.prototype.removeRelation = function(relation) {
    this.module.removeRelation(relation);
    this.port.removeRelation(relation);
  };

  Unit.prototype.canConnectTo = function(unit) {
    if (this.type() !== unit.type()) {
      return false;
    }
    if (this.plugDisabled() || unit.socketDisabled()) {
      return false;
    }
    if (!this.visible() || !unit.visible()) {
      return false;
    }
    if (unit.socketConnected()) {
      return false;
    }
    return true;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Unit;
  } else {
    app.Unit = Unit;
  }
})(this.app || (this.app = {}));
