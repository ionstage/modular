(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Binding = app.Binding || require('../models/binding.js');

  var BindingCollection = function() {
    this.data = [];
  };

  BindingCollection.prototype.add = function(props) {
    if (this.lastIndexOf(props) !== -1) {
      return;
    }

    var binding = new Binding(props);
    binding.bind();
    this.data.push(binding);
  };

  BindingCollection.prototype.remove = function(props) {
    var index = this.lastIndexOf(props);
    if (index === -1) {
      return;
    }

    var binding = this.data[index];
    binding.unbind();
    helper.removeAt(this.data, index);
  };

  BindingCollection.prototype.lastIndexOf = function(props) {
    return helper.findLastIndex(this.data, function(binding) {
      return helper.equal(helper.clone(binding), props);
    });
  };

  BindingCollection.prototype.forEach = function(callback) {
    // keep original bindings for calling remove in loop
    this.data.slice().forEach(callback, this);
  };

  BindingCollection.prototype.map = function(callback) {
    return this.data.map(callback, this);
  };

  BindingCollection.prototype.filter = function(props) {
    var keys = Object.keys(props);
    return this.data.filter(function(binding) {
      return helper.equal(helper.pick(binding, keys), props);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BindingCollection;
  } else {
    app.BindingCollection = BindingCollection;
  }
})(this.app || (this.app = {}));
