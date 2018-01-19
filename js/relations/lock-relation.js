(function(app) {
  'use strict';

  var jCore = require('jcore');

  var LockRelation = jCore.Relation.inherits(function(props) {
    this.type = props.type;
    this.port = props.port;
    this.wire = props.wire;
    this.updater = LockRelation.UPDATERS[this.type];
  });

  LockRelation.prototype.update = function() {
    this.updater(this.port, this.wire);
  };

  LockRelation.UPDATERS = [
    function(port, wire) {
      wire.sourceX(port.plugX());
      wire.sourceY(port.plugY());
    },
    function(port, wire) {
      wire.targetX(port.socketX());
      wire.targetY(port.socketY());
    },
  ];

  LockRelation.TYPE_PLUG = 0;
  LockRelation.TYPE_SOCKET = 1;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelation;
  } else {
    app.LockRelation = LockRelation;
  }
})(this.app || (this.app = {}));
