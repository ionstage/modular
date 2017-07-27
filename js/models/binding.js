(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var CircuitModule = app.CircuitModule || require('./circuit-module.js');

  var Binding = function(props) {
    this.sourceUnit = props.sourceUnit;
    this.targetUnit = props.targetUnit;
  };

  Binding.prototype.source = function() {
    return this.sourceUnit.circuitModuleMember();
  };

  Binding.prototype.target = function() {
    return this.targetUnit.circuitModuleMember();
  };

  Binding.prototype.bind = function() {
    CircuitModule.bind(this.source(), this.target());
  };

  Binding.prototype.unbind = function() {
    CircuitModule.unbind(this.source(), this.target());
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Binding;
  } else {
    app.Binding = Binding;
  }
})(this.app || (this.app = {}));
