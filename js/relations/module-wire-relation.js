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

  ModuleWireRelation.prototype.consistsOf = function(type, module, port, wire) {
    return (this.type() === type &&
            this.module() === module &&
            this.port() === port &&
            this.wire() === wire);
  };

  ModuleWireRelation.prototype.update = function() {
    var port = this.port();

    if (!port.visible())
      return;

    var type = this.type();
    var module = this.module();
    var wire = this.wire();

    var offsetX = ({
      source: ModulePort.PLUG_OFFSET_X,
      target: ModulePort.SOCKET_OFFSET_X
    })[type];

    var x = module.x() + offsetX;
    var y = module.y() + module.portListTop() + port.top() + port.height() / 2;

    wire[type + 'X'](x);
    wire[type + 'Y'](y);
  };

  ModuleWireRelation.TYPE_SOURCE = 'source';
  ModuleWireRelation.TYPE_TARGET = 'target';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleWireRelation;
  else
    app.ModuleWireRelation = ModuleWireRelation;
})(this.app || (this.app = {}));
