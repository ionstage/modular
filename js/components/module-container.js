(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ModuleContainer = helper.inherits(function() {
    ModuleContainer.super_.call(this);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleContainer;
  else
    app.ModuleContainer = ModuleContainer;
})(this.app || (this.app = {}));
