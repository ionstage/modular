(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ModulePort = helper.inherits(function() {
    ModulePort.super_.call(this);

    this.element = this.prop(null);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModulePort;
  else
    app.ModulePort = ModulePort;
})(this.app || (this.app = {}));
