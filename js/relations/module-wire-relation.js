(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ModuleWireRelation = helper.inherits(function() {
    ModuleWireRelation.super_.call(this);
  }, jCore.Relation);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleWireRelation;
  else
    app.ModuleWireRelation = ModuleWireRelation;
})(this.app || (this.app = {}));
