(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var LockRelation = helper.inherits(function(props) {
    this.type = props.type;
    this.unit = props.unit;
    this.wire = props.wire;
  }, jCore.Relation);

  LockRelation.prototype.equal = function(other) {
    return (!!other && Object.keys(this).every(function(key) {
      return helper.equal(this[key], other[key]);
    }.bind(this)));
  };

  LockRelation.prototype.unitPosition = function() {
    var methodName = LockRelation.TYPE_POSITION_TABLE[this.type].methodName;
    return this.unit[methodName]();
  };

  LockRelation.prototype.wirePosition = function(position) {
    var wire = this.wire;
    var positionType = LockRelation.TYPE_POSITION_TABLE[this.type].type;
    wire[positionType + 'X'](position.x);
    wire[positionType + 'Y'](position.y);
  };

  LockRelation.prototype.update = function() {
    this.wirePosition(this.unitPosition());
  };

  LockRelation.TYPE_PLUG = 'plug';
  LockRelation.TYPE_SOCKET = 'socket';

  LockRelation.TYPE_POSITION_TABLE = (function() {
    var table = {};
    table[LockRelation.TYPE_PLUG] = { methodName: 'plugPosition', type: 'source' };
    table[LockRelation.TYPE_SOCKET] = { methodName: 'socketPosition', type: 'target' };
    return table;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelation;
  } else {
    app.LockRelation = LockRelation;
  }
})(this.app || (this.app = {}));
