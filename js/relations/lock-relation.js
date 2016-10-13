(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var LockRelation = helper.inherits(function(props) {
    LockRelation.super_.call(this);

    this.type = this.prop(props.type);
    this.module = this.prop(props.module);
    this.port = this.prop(props.port);
    this.wire = this.prop(props.wire);
  }, jCore.Relation);

  LockRelation.prototype.positionType = (function() {
    var map = { plug: 'source', socket: 'target' };
    return function() {
      return map[this.type()];
    };
  })();

  LockRelation.prototype.equal = function(other) {
    return Object.keys(this).every(function(key) {
      return helper.equal(this[key](), other[key]());
    }.bind(this));
  };

  LockRelation.prototype.update = function() {
    var wire = this.wire();
    var positionType = this.positionType();
    var position = this.module()[this.type() + 'Position'](this.port());

    wire[positionType + 'X'](position.x);
    wire[positionType + 'Y'](position.y);
  };

  LockRelation.TYPE_PLUG = 'plug';
  LockRelation.TYPE_SOCKET = 'socket';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = LockRelation;
  else
    app.LockRelation = LockRelation;
})(this.app || (this.app = {}));
