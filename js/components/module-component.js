(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ModuleComponent = helper.inherits(function() {
    ModuleComponent.super_.call(this);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleComponent;
  else
    app.ModuleComponent = ModuleComponent;
})(this.app || (this.app = {}));
