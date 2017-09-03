(function(app) {
  'use strict';

  var helper = {};

  helper.randomString = function(len) {
    var s = [];
    for (var i = 0, n = Math.ceil(len / 7); i < n; i++) {
      s.push(Math.random().toString(36).slice(-7));
    }
    return s.join('').slice(-len);
  };

  helper.encodePath = function(str) {
    return str.split('/').map(function(s) {
      return encodeURIComponent(s);
    }).join('/');
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
        configurable: true,
      },
    });
    return ctor;
  };

  helper.define = function(obj, key, value, option) {
    var props = helper.extend(helper.clone(option || {}), { value: value });
    return Object.defineProperty(obj, key, props);
  };

  helper.equal = function(a, b) {
    if (a === b) {
      return true;
    }
    if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') {
      return (a === b);
    }
    var keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) {
      return false;
    }
    return keys.every(function(key) {
      return (b.hasOwnProperty(key) && helper.equal(a[key], b[key]));
    });
  };

  helper.toArray = function(value) {
    return Array.prototype.slice.call(value);
  };

  helper.extend = function(obj, src) {
    Object.keys(src).forEach(function(key) {
      obj[key] = src[key];
    });
    return obj;
  };

  helper.clone = function(obj) {
    return helper.extend({}, obj);
  };

  helper.pick = function(obj, keys) {
    return keys.reduce(function(ret, key) {
      if (obj.hasOwnProperty(key)) {
        ret[key] = obj[key];
      }
      return ret;
    }, {});
  };

  helper.dig = function() {
    return helper.toArray(arguments).reduce(function(obj, key) {
      return (typeof obj === 'object' ? obj[key] : null);
    });
  };

  helper.sortBy = function(array, iteratee) {
    return array.sort(function(a, b) {
      var l = iteratee(a);
      var r = iteratee(b);
      if (l < r) {
        return -1;
      }
      if (l > r) {
        return 1;
      }
      return 0;
    });
  };

  helper.remove = function(array, item) {
    var index = array.indexOf(item);
    if (index < 0 || index >= array.length) {
      throw new RangeError('Invalid index');
    }
    array.splice(index, 1);
  };

  helper.moveToBack = function(array, item) {
    helper.remove(array, item);
    array.push(item);
  };

  helper.findIndex = function(array, callback) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (callback(array[i], i, array)) {
        return i;
      }
    }
    return -1;
  };

  helper.findLastIndex = function(array, callback) {
    for (var i = array.length - 1; i >= 0; i--) {
      if (callback(array[i], i, array)) {
        return i;
      }
    }
    return -1;
  };

  helper.find = function(array, callback) {
    var index = helper.findIndex(array, callback);
    return (index !== -1 ? array[index] : null);
  };

  helper.findLast = function(array, callback) {
    var index = helper.findLastIndex(array, callback);
    return (index !== -1 ? array[index] : null);
  };

  helper.flatten = function(array) {
    return Array.prototype.concat.apply([], array);
  };

  helper.wrapper = function() {
    var Wrapper = function(self, wrapper) {
      return helper.define(wrapper, 'unwrap', Wrapper.unwrap.bind(self));
    };

    Wrapper.unwrap = function(key) {
      return (key === Wrapper.KEY ? this : null);
    };

    Wrapper.KEY = {};

    return Wrapper;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = helper;
  } else {
    app.helper = helper;
  }
})(this.app || (this.app = {}));
