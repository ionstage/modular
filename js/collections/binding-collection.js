(function(app) {
  'use strict';

  var Binding = app.Binding || require('../models/binding.js');
  var Collection = app.Collection || require('./collection.js');

  var BindingCollection = Collection.inherits();

  BindingCollection.prototype.builder = function(props) {
    return new Binding(props);
  };

  BindingCollection.prototype.onadd = function(binding) {
    binding.bind();
  };

  BindingCollection.prototype.onremove = function(binding) {
    binding.unbind();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BindingCollection;
  } else {
    app.BindingCollection = BindingCollection;
  }
})(this.app || (this.app = {}));
