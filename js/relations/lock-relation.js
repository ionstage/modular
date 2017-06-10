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

  LockRelation.prototype.set = function() {
    this.unit.addRelation(this);
  };

  LockRelation.prototype.unset = function() {
    this.unit.removeRelation(this);
  };

  LockRelation.prototype.unitPosition = function() {
    return this.unit[this.type.positionMethodName]();
  };

  LockRelation.prototype.wirePosition = function(position) {
    var wire = this.wire;
    var positionType = this.type.positionType;
    wire[positionType + 'X'](position.x);
    wire[positionType + 'Y'](position.y);
  };

  LockRelation.prototype.update = function() {
    this.wirePosition(this.unitPosition());
  };

  LockRelation.TYPE_PLUG = {
    positionMethodName: 'portPlugPosition',
    positionType: 'source',
  };

  LockRelation.TYPE_SOCKET = {
    positionMethodName: 'portSocketPosition',
    positionType: 'target',
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelation;
  } else {
    app.LockRelation = LockRelation;
  }
})(this.app || (this.app = {}));
