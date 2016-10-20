(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var ModuleUnit = function(props) {
    this.module = props.module;
    this.port = props.port;
  };

  ModuleUnit.prototype.equal = function(other) {
    return Object.keys(this).every(function(key) {
      return helper.equal(this[key], other[key]);
    }.bind(this));
  };

  ModuleUnit.prototype.portType = function() {
    return this.port.type();
  };

  ModuleUnit.prototype.portSocketConnected = function(value) {
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
    this.module.relations().push(relation);
    this.port.relations().push(relation);
  };

  ModuleUnit.prototype.removeRelation = function(relation) {
    helper.remove(this.module.relations(), relation);
    helper.remove(this.port.relations(), relation);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleUnit;
  else
    app.ModuleUnit = ModuleUnit;
})(this.app || (this.app = {}));
