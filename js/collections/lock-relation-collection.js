(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');

  var LockRelationCollection = function() {
    this.data = new helper.Map();
  };

  LockRelationCollection.prototype.add = function(props) {
    var data = this.data;
    var relation = new LockRelation(props);

    if (data.has(relation)) {
      return;
    }

    relation.set();
    data.set(relation, relation);
  };

  LockRelationCollection.prototype.remove = function(props) {
    var data = this.data;
    var relation = data.get(new LockRelation(props));

    if (!relation) {
      return;
    }

    relation.unset();
    data.delete(relation);
  };

  LockRelationCollection.prototype.filter = function(props) {
    var relations = [];
    var keys = Object.keys(props);
    this.data.forEach(function(relation) {
      var matched = keys.every(function(key) {
        return helper.equal(relation[key], props[key]);
      });
      if (matched) {
        relations.push(relation);
      }
    });
    return relations;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelationCollection;
  } else {
    app.LockRelationCollection = LockRelationCollection;
  }
})(this.app || (this.app = {}));
