(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ModuleContainer = helper.inherits(function(props) {
    ModuleContainer.super_.call(this);

    this.element = this.prop(props.element);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleContainer;
  else
    app.ModuleContainer = ModuleContainer;
})(this.app || (this.app = {}));
