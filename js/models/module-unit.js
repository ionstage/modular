(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var ModuleUnit = function(props) {
    this.module = props.module;
    this.port = props.port;
  };

  ModuleUnit.prototype.equal = function(other) {
    return (!!other && Object.keys(this).every(function(key) {
      return helper.equal(this[key], other[key]);
    }.bind(this)));
  };

  ModuleUnit.prototype.contains = function(component) {
    return Object.keys(this).some(function(key) {
      return helper.equal(this[key], component);
    }.bind(this));
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

    // module is deletable if all port labels are NOT highlighted
    this.module.deletable(this.module.ports().every(function(port) {
      return !port.highlighted();
    }));
  };

  ModuleUnit.prototype.addRelation = function(relation) {
    this.module.relations().push(relation);
    this.port.relations().push(relation);
  };

  ModuleUnit.prototype.removeRelation = function(relation) {
    helper.remove(this.module.relations(), relation);
    helper.remove(this.port.relations(), relation);
  };

  ModuleUnit.fromModuleAndPortName = function(module, portName) {
    if (!module) {
      return null;
    }

    var port = module.port(portName);
    if (!port) {
      return null;
    }

    return new ModuleUnit({ module: module, port: port });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleUnit;
  } else {
    app.ModuleUnit = ModuleUnit;
  }
})(this.app || (this.app = {}));
