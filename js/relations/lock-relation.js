(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var LockRelation = helper.inherits(function(props) {
    this.type = props.type;
    this.unit = props.unit;
    this.wire = props.wire;
  }, jCore.Relation);

  LockRelation.prototype.set = function() {
    this.unit.addRelation(this);
  };

  LockRelation.prototype.unset = function() {
    this.unit.removeRelation(this);
  };

  LockRelation.prototype.unitPosition = function() {
    return this.unit[this.type.unitPositionName]();
  };

  LockRelation.prototype.wirePosition = function(position) {
    this.wire[this.type.wirePositionNames.x](position.x);
    this.wire[this.type.wirePositionNames.y](position.y);
  };

  LockRelation.prototype.update = function() {
    this.wirePosition(this.unitPosition());
  };

  LockRelation.TYPE_PLUG = {
    unitPositionName: 'portPlugPosition',
    wirePositionNames: { x: 'sourceX', y: 'sourceY' },
  };

  LockRelation.TYPE_SOCKET = {
    unitPositionName: 'portSocketPosition',
    wirePositionNames: { x: 'targetX', y: 'targetY' },
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelation;
  } else {
    app.LockRelation = LockRelation;
  }
})(this.app || (this.app = {}));
