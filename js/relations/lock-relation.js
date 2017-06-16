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
    this.wire[this.type.positionNameX](position.x);
    this.wire[this.type.positionNameY](position.y);
  };

  LockRelation.prototype.update = function() {
    this.wirePosition(this.unitPosition());
  };

  LockRelation.TYPE_PLUG = {
    positionMethodName: 'portPlugPosition',
    positionNameX: 'sourceX',
    positionNameY: 'sourceY',
  };

  LockRelation.TYPE_SOCKET = {
    positionMethodName: 'portSocketPosition',
    positionNameX: 'targetX',
    positionNameY: 'targetY',
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelation;
  } else {
    app.LockRelation = LockRelation;
  }
})(this.app || (this.app = {}));
