(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ModulePort = helper.inherits(function(props) {
    ModulePort.super_.call(this);

    this.label = this.prop(props.label);
    this.name = this.prop(props.name);
    this.type = this.prop(props.type);
    this.socketDisabled = this.prop(props.socketDisabled);
    this.plugDisabled = this.prop(props.plugDisabled);
    this.visible = this.prop(false);
    this.element = this.prop(null);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModulePort;
  else
    app.ModulePort = ModulePort;
})(this.app || (this.app = {}));
