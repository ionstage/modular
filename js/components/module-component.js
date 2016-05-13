(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ModuleComponent = helper.inherits(function(props) {
    ModuleComponent.super_.call(this);

    this.element = this.prop(props.element);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleComponent;
  else
    app.ModuleComponent = ModuleComponent;
})(this.app || (this.app = {}));
