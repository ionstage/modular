(function(app) {
  'use strict';

  var Collection = app.Collection || require('./collection.js');

  var RelationCollection = Collection.inherits(function(props) {
    this.ctor = props.ctor;
  });

  RelationCollection.prototype.builder = function(props) {
    return new this.ctor(props);
  };

  RelationCollection.prototype.onadd = function(relation) {
    relation.set();
  };

  RelationCollection.prototype.onremove = function(relation) {
    relation.unset();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelationCollection;
  } else {
    app.RelationCollection = RelationCollection;
  }
})(this.app || (this.app = {}));
