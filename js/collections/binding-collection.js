(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Binding = app.Binding || require('../models/binding.js');

  var BindingCollection = function() {
    this.data = new helper.Set();
  };

  BindingCollection.prototype.toArray = function() {
    return this.data.toArray();
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BindingCollection;
  } else {
    app.BindingCollection = BindingCollection;
  }
})(this.app || (this.app = {}));
