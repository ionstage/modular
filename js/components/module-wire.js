(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ModuleWire = helper.inherits(function() {
    ModuleWire.super_.call(this);

    this.element = this.prop(null);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleWire;
  else
    app.ModuleWire = ModuleWire;
})(this.app || (this.app = {}));
