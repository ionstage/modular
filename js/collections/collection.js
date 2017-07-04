(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var Collection = function() {
    this.data = [];
  };

  Collection.prototype.add = function(props) {
    if (this.lastIndexOf(props) !== -1) {
      return;
    }

    var item = this.builder(props);
    this.onadd(item);
    this.data.push(item);
  };

  Collection.prototype.remove = function(props) {
    var index = this.lastIndexOf(props);
    if (index === -1) {
      return;
    }

    var item = this.data[index];
    this.onremove(item);
    helper.removeAt(this.data, index);
  };

  Collection.prototype.lastIndexOf = function(props) {
    return helper.findLastIndex(this.data, function(item) {
      return helper.equal(helper.clone(item), props);
    });
  };

  Collection.prototype.forEach = function(callback) {
    // keep original bindings for calling remove in loop
    this.data.slice().forEach(callback, this);
  };

  Collection.prototype.map = function(callback) {
    return this.data.map(callback, this);
  };

  Collection.prototype.filter = function(props) {
    var keys = Object.keys(props);
    return this.data.filter(function(item) {
      return helper.equal(helper.pick(item, keys), props);
    });
  };

  Collection.prototype.builder = function(props) {
    return props;
  };

  Collection.prototype.onadd = function(item) {};

  Collection.prototype.onremove = function(item) {};

  Collection.inherits = function() {
    return helper.inherits(function() {
      Collection.call(this);
    }, Collection);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Collection;
  } else {
    app.Collection = Collection;
  }
})(this.app || (this.app = {}));
