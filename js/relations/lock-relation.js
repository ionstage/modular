(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var LockRelation = helper.inherits(function(props) {
    this.type = props.type;
    this.module = props.module;
    this.port = props.port;
    this.wire = props.wire;
  }, jCore.Relation);

  LockRelation.prototype.set = function() {
    this.module.addRelation(this);
    this.port.addRelation(this);
  };

  LockRelation.prototype.unset = function() {
    this.module.removeRelation(this);
    this.port.removeRelation(this);
  };

  LockRelation.prototype.update = function() {
    var x = this.module[this.type.moduleKeys.x](this.port);
    var y = this.module[this.type.moduleKeys.y](this.port);
    this.wire[this.type.wireKeys.x](x);
    this.wire[this.type.wireKeys.y](y);
  };

  LockRelation.TYPE_PLUG = {
    moduleKeys: { x: 'plugX', y: 'plugY' },
    wireKeys: { x: 'sourceX', y: 'sourceY' },
  };

  LockRelation.TYPE_SOCKET = {
    moduleKeys: { x: 'socketX', y: 'socketY' },
    wireKeys: { x: 'targetX', y: 'targetY' },
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelation;
  } else {
    app.LockRelation = LockRelation;
  }
})(this.app || (this.app = {}));
