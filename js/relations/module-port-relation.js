(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ModulePortRelation = helper.inherits(function(props) {
    this.module = props.module;
    this.port = props.port;
  }, jCore.Relation);

  ModulePortRelation.prototype.set = function() {
    this.port.addRelation(this);
  };

  ModulePortRelation.prototype.unset = function() {
    this.port.removeRelation(this);
  };

  ModulePortRelation.prototype.update = function() {
    // module is deletable if all ports are NOT highlighted
    this.module.deletable(!this.module.hasHighlightedPort());
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePortRelation;
  } else {
    app.ModulePortRelation = ModulePortRelation;
  }
})(this.app || (this.app = {}));
