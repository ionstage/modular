(function(app) {
  'use strict';

  var Collection = app.Collection || require('./collection.js');
  var LockRelation = app.LockRelation || require('../relations/lock-relation.js');

  var LockRelationCollection = Collection.inherits();

  LockRelationCollection.prototype.builder = function(props) {
    return new LockRelation(props);
  };

  LockRelationCollection.prototype.onadd = function(relation) {
    relation.set();
  };

  LockRelationCollection.prototype.onremove = function(relation) {
    relation.unset();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockRelationCollection;
  } else {
    app.LockRelationCollection = LockRelationCollection;
  }
})(this.app || (this.app = {}));
