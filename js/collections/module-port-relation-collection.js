(function(app) {
  'use strict';

  var Collection = app.Collection || require('./collection.js');
  var ModulePortRelation = app.ModulePortRelation || require('../relations/module-port-relation.js');

  var ModulePortRelationCollection = Collection.inherits();

  ModulePortRelationCollection.prototype.builder = function(props) {
    return new ModulePortRelation(props);
  };

  ModulePortRelationCollection.prototype.onadd = function(relation) {
    relation.set();
  };

  ModulePortRelationCollection.prototype.onremove = function(relation) {
    relation.unset();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePortRelationCollection;
  } else {
    app.ModulePortRelationCollection = ModulePortRelationCollection;
  }
})(this.app || (this.app = {}));
