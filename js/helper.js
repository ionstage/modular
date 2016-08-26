(function(app) {
  'use strict';

  var helper = {};

  helper.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });

    return ctor;
  };

  helper.identity = function(value) {
    return value;
  };

  helper.extend = function(obj) {
    for (var i = 1, len = arguments.length; i < len; i++) {
      var src = arguments[i];
      for (var key in src) {
        obj[key] = src[key];
      }
    }
    return obj;
  };

  helper.pick = function(obj, keys) {
    var ret = {};
    if (!obj)
      return ret;
    keys.forEach(function(key) {
      if (key in obj)
        ret[key] = obj[key];
    });
    return ret;
  };

  helper.dig = function() {
    var args = Array.prototype.slice.call(arguments);
    return args.reduce(function(prev, curr) {
      return (typeof prev === 'object') ? prev[curr] : null;
    });
  };

  helper.sortBy = function(list, key) {
    return list.slice().sort(function(a, b) {
      if (a[key] > b[key])
        return 1;
      else if (a[key] < b[key])
        return -1;
      return 0;
    });
  };

  helper.List = (function() {
    var List = function() {
      this.data = [];
    };

    List.prototype.add = function(item) {
      if (!this.contains(item))
        this.data.push(item);
    };

    List.prototype.remove = function(item) {
      var data = this.data;

      for (var i = data.length - 1; i >= 0; i--) {
        if (this.equal(data[i], item)) {
          data.splice(i, 1);
          break;
        }
      }
    };

    List.prototype.contains = function(item) {
      return this.data.some(function(dataItem) {
        return this.equal(dataItem, item);
      }.bind(this));
    };

    List.prototype.equal = function(a, b) {
      return a === b;
    };

    List.prototype.toArray = function() {
      return this.data.slice();
    };

    return List;
  })();

  if (typeof module !== 'undefined' && module.exports)
    module.exports = helper;
  else
    app.helper = helper;
})(this.app || (this.app = {}));
