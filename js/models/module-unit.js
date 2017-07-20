(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var ModuleUnit = function(props) {
    this.module = props.module;
    this.port = props.port;
  };

  ModuleUnit.prototype.contains = function(component) {
    return (this.module === component || this.port === component);
  };

  ModuleUnit.prototype.name = function() {
    return this.port.name();
  };

  ModuleUnit.prototype.type = function() {
    return this.port.type();
  };

  ModuleUnit.prototype.plugDisabled = function() {
    return this.port.plugDisabled();
  };

  ModuleUnit.prototype.socketDisabled = function() {
    return this.port.socketDisabled();
  };

  ModuleUnit.prototype.visible = function() {
    return this.port.visible();
  };

  ModuleUnit.prototype.highlighted = function(value) {
    this.port.highlighted(value);
  };

  ModuleUnit.prototype.plugHighlighted = function(value) {
    return this.port.plugHighlighted(value);
  };

  ModuleUnit.prototype.socketHighlighted = function(value) {
    return this.port.socketHighlighted(value);
  };

  ModuleUnit.prototype.socketConnected = function(value) {
    return this.port.socketConnected(value);
  };

  ModuleUnit.prototype.circuitElementMember = function() {
    return this.module.circuitElementMember(this.port.name());
  };

  ModuleUnit.prototype.plugPosition = function() {
    return this.module.plugPosition(this.port);
  };

  ModuleUnit.prototype.socketPosition = function() {
    return this.module.socketPosition(this.port);
  };

  ModuleUnit.prototype.addRelation = function(relation) {
    this.module.addRelation(relation);
    this.port.addRelation(relation);
  };

  ModuleUnit.prototype.removeRelation = function(relation) {
    this.module.removeRelation(relation);
    this.port.removeRelation(relation);
  };

  ModuleUnit.fromModuleAndPortName = function(module, portName) {
    var port = (module ? module.port(portName) : null);
    return (port ? new ModuleUnit({ module: module, port: port }) : null);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleUnit;
  } else {
    app.ModuleUnit = ModuleUnit;
  }
})(this.app || (this.app = {}));
