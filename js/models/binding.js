(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var CircuitElement = app.CircuitElement || require('./circuit-element.js');

  var Binding = function(props) {
    this.sourceUnit = props.sourceUnit;
    this.targetUnit = props.targetUnit;
  };

  Binding.prototype.equal = function(other) {
    if (!other) {
      return false;
    }
    return Object.keys(this).every(function(key) {
      return helper.equal(this[key], other[key]);
    }.bind(this));
  };

  Binding.prototype.source = function() {
    return this.sourceUnit.circuitElementMember();
  };

  Binding.prototype.target = function() {
    return this.targetUnit.circuitElementMember();
  };

  Binding.prototype.bind = function() {
    CircuitElement.bind(this.source(), this.target());
  };

  Binding.prototype.unbind = function() {
    CircuitElement.unbind(this.source(), this.target());
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Binding;
  } else {
    app.Binding = Binding;
  }
})(this.app || (this.app = {}));
