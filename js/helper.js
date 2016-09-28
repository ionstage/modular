(function(app) {
  'use strict';

  var helper = {};

  helper.randomString = function(len) {
    var s = [];
    for (var i = 0, n = Math.floor(len / 7); i < n; i++) {
      s.push(Math.random().toString(36).slice(-7));
    }
    var rem = len % 7;
    if (rem)
      s.push(Math.random().toString(36).slice(-rem));
    return s.join('');
  };

  helper.clamp = function(number, lower, upper) {
    return Math.min(Math.max(number, lower), upper);
  };

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

  helper.clone = function(obj) {
    var ret = {};
    for (var key in obj) {
      ret[key] = obj[key];
    }
    return ret;
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

  helper.sortBy = function(array, key) {
    return array.slice().sort(function(a, b) {
      if (a[key] > b[key])
        return 1;
      else if (a[key] < b[key])
        return -1;
      return 0;
    });
  };

  helper.remove = function(array, item) {
    array.splice(array.indexOf(item), 1);
  };

  helper.Set = (function() {
    var Set = function() {
      this.data = [];
    };

    Set.prototype.add = function(item) {
      if (!this.contains(item))
        this.data.push(item);
    };

    Set.prototype.remove = function(item) {
      var data = this.data;

      for (var i = data.length - 1; i >= 0; i--) {
        if (this.equal(data[i], item)) {
          data.splice(i, 1);
          break;
        }
      }
    };

    Set.prototype.contains = function(item) {
      return this.data.some(function(dataItem) {
        return this.equal(dataItem, item);
      }.bind(this));
    };

    Set.prototype.equal = function(a, b) {
      return a === b;
    };

    Set.prototype.toArray = function() {
      return this.data.slice();
    };

    return Set;
  })();

  if (typeof module !== 'undefined' && module.exports)
    module.exports = helper;
  else
    app.helper = helper;
})(this.app || (this.app = {}));
