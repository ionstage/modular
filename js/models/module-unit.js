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

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleUnit;
  else
    app.ModuleUnit = ModuleUnit;
})(this.app || (this.app = {}));
