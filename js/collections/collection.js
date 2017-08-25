(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var Collection = function() {
    this.data = [];
  };

  Collection.prototype.add = function(props) {
    var item = this.builder(props);
    this.data.push(item);
    this.onadd(item);
  };

  Collection.prototype.remove = function(props) {
    var item = this.data[this.lastIndexOf(props)];
    helper.remove(this.data, item);
    this.onremove(item);
  };

  Collection.prototype.lastIndexOf = function(props) {
    return helper.findLastIndex(this.data, function(item) {
      return helper.equal(helper.clone(item), props);
    });
  };

  Collection.prototype.forEach = function(callback) {
    // keep original items for calling remove in loop
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

  Collection.inherits = function(initializer) {
    return helper.inherits(function(props) {
      Collection.call(this);
      if (typeof initializer === 'function') {
        initializer.call(this, props);
      }
    }, Collection);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Collection;
  } else {
    app.Collection = Collection;
  }
})(this.app || (this.app = {}));
