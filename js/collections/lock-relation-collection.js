(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');

  var LockRelationCollection = function() {
    this.data = [];
  };

  LockRelationCollection.prototype.add = function(props) {
    if (this.lastIndexOf(props) !== -1) {
      return;
    }

    var relation = new LockRelation(props);
    relation.set();
    this.data.push(relation);
  };

  LockRelationCollection.prototype.remove = function(props) {
    var index = this.lastIndexOf(props);
    if (index === -1) {
      return;
    }

    var relation = this.data[index];
    relation.unset();
    this.data.splice(index, 1);
  };

  LockRelationCollection.prototype.lastIndexOf = function(props) {
    return helper.findLastIndex(this.data, function(relation) {
      return helper.deepEqual(helper.clone(relation), props);
    });
  };

  LockRelationCollection.prototype.filter = function(props) {
    var keys = Object.keys(props);
    return this.data.filter(function(relation) {
      return helper.deepEqual(helper.pick(relation, keys), props);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelationCollection;
  } else {
    app.LockRelationCollection = LockRelationCollection;
  }
})(this.app || (this.app = {}));
