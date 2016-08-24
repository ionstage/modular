(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var ModulePort = app.ModulePort || require('./module-port.js');

  var ModuleWireRelation = helper.inherits(function(props) {
    ModuleWireRelation.super_.call(this);

    this.type = this.prop(props.type);
    this.module = this.prop(props.module);
    this.port = this.prop(props.port);
    this.wire = this.prop(props.wire);
  }, jCore.Relation);

  ModuleWireRelation.prototype.positionType = (function() {
    var map = { source: 'plug', target: 'socket' };
    return function() {
      return map[this.type()];
    };
  })();

  ModuleWireRelation.prototype.consistsOf = function(type, module, port, wire) {
    return (this.type() === type &&
            this.module() === module &&
            this.port() === port &&
            this.wire() === wire);
  };

  ModuleWireRelation.prototype.update = function() {
    var type = this.type();
    var wire = this.wire();
    var position = this.module()[this.positionType() + 'Position'](this.port());

    wire[type + 'X'](position.x);
    wire[type + 'Y'](position.y);
  };

  ModuleWireRelation.TYPE_SOURCE = 'source';
  ModuleWireRelation.TYPE_TARGET = 'target';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleWireRelation;
  else
    app.ModuleWireRelation = ModuleWireRelation;
})(this.app || (this.app = {}));
