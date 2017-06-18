(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Binding = app.Binding || require('../models/binding.js');

  var BindingCollection = function() {
    this.data = new helper.Set();
  };

  BindingCollection.prototype.add = function(props) {
    var data = this.data;
    var binding = new Binding(props);

    if (data.has(binding)) {
      return;
    }

    binding.bind();
    data.add(binding);
  };

  BindingCollection.prototype.remove = function(props) {
    var data = this.data;
    var binding = new Binding(props);

    if (!data.has(binding)) {
      return;
    }

    binding.unbind();
    data.delete(binding);
  };

  BindingCollection.prototype.forEach = function(callback) {
    // keep original bindings for calling remove in loop
    this.map(helper.identity).forEach(function(binding) {
      callback(binding);
    });
  };

  BindingCollection.prototype.map = function(callback) {
    var array = [];
    this.data.forEach(function(binding) {
      array.push(callback(binding));
    });
    return array;
  };

  BindingCollection.prototype.filter = function(props) {
    var bindings = [];
    var keys = Object.keys(props);
    this.data.forEach(function(binding) {
      if (helper.deepEqual(helper.pick(binding, keys), props)) {
        bindings.push(binding);
      }
    });
    return bindings;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BindingCollection;
  } else {
    app.BindingCollection = BindingCollection;
  }
})(this.app || (this.app = {}));
