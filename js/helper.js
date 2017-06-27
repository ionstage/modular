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

  helper.identity = function(value) {
    return value;
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
      return helper.equal(a[key], b[key]);
    });
  };

  helper.values = function(obj) {
    return Object.keys(obj).map(function(key) {
      return obj[key];
    });
  };

  helper.clone = function(obj) {
    var ret = {};
    Object.keys(obj).forEach(function(key) {
      ret[key] = obj[key];
    });
    return ret;
  };

  helper.extend = function(obj, src) {
    Object.keys(src).forEach(function(key) {
      obj[key] = src[key];
    });
    return obj;
  };

  helper.pick = function(obj, keys) {
    var ret = {};
    keys.forEach(function(key) {
      if (key in obj) {
        ret[key] = obj[key];
      }
    });
    return ret;
  };

  helper.dig = function() {
    var args = Array.prototype.slice.call(arguments);
    return args.reduce(function(obj, key) {
      return (typeof obj === 'object') ? obj[key] : null;
    });
  };

  helper.sortBy = function(array, iteratee) {
    var isCallback = (typeof iteratee === 'function');
    return array.sort(function(a, b) {
      var l = (isCallback ? iteratee(a) : a[iteratee]);
      var r = (isCallback ? iteratee(b) : b[iteratee]);
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
    if (index === -1) {
      return;
    }
    array.splice(index, 1);
  };

  helper.moveToBack = function(array, item) {
    var index = array.indexOf(item);
    if (index === -1) {
      return;
    }
    array.splice(index, 1);
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

  helper.wrapper = function() {
    var Wrapper = function(obj, self) {
      obj.unwrap = Wrapper.unwrap.bind(self);
      return obj;
    };

    Wrapper.unwrap = function(key) {
      if (key === Wrapper.KEY) {
        return this;
      }
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
