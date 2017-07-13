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

  ModuleUnit.prototype.portName = function() {
    return this.port.name();
  };

  ModuleUnit.prototype.portType = function() {
    return this.port.type();
  };

  ModuleUnit.prototype.portPlugDisabled = function() {
    return this.port.plugDisabled();
  };

  ModuleUnit.prototype.portSocketDisabled = function() {
    return this.port.socketDisabled();
  };

  ModuleUnit.prototype.portVisible = function() {
    return this.port.visible();
  };

  ModuleUnit.prototype.portSocketConnected = function(value) {
    return this.port.socketConnected(value);
  };

  ModuleUnit.prototype.portPlugHighlighted = function(value) {
    return this.port.plugHighlighted(value);
  };

  ModuleUnit.prototype.portSocketHighlighted = function(value) {
    return this.port.socketHighlighted(value);
  };

  ModuleUnit.prototype.circuitElementMember = function() {
    return this.module.circuitElementMember(this.port.name());
  };

  ModuleUnit.prototype.portPlugPosition = function() {
    return this.module.plugPosition(this.port);
  };

  ModuleUnit.prototype.portSocketPosition = function() {
    return this.module.socketPosition(this.port);
  };

  ModuleUnit.prototype.portHighlighted = function(value) {
    this.port.highlighted(value);

    // module is deletable if all ports are NOT highlighted
    this.module.deletable(!this.module.hasHighlightedPort());
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
