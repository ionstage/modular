(function(app) {
  'use strict';

  var jCore = require('jcore');

  var LockRelation = jCore.Relation.inherits(function(props) {
    this.type = props.type;
    this.port = props.port;
    this.wire = props.wire;
  });

  LockRelation.prototype.update = function() {
    var x = this.port[this.type.portKeys.x]();
    var y = this.port[this.type.portKeys.y]();
    this.wire[this.type.wireKeys.x](x);
    this.wire[this.type.wireKeys.y](y);
  };

  LockRelation.TYPE_PLUG = {
    portKeys: { x: 'plugX', y: 'plugY' },
    wireKeys: { x: 'sourceX', y: 'sourceY' },
  };

  LockRelation.TYPE_SOCKET = {
    portKeys: { x: 'socketX', y: 'socketY' },
    wireKeys: { x: 'targetX', y: 'targetY' },
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelation;
  } else {
    app.LockRelation = LockRelation;
  }
})(this.app || (this.app = {}));
