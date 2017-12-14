(function(app) {
  'use strict';

  var helper = {};

  helper.encodePath = function(str) {
    return str.split('/').map(function(s) {
      return encodeURIComponent(s);
    }).join('/');
  };

  helper.clamp = function(number, lower, upper) {
    return Math.min(Math.max(number, lower), upper);
  };

  helper.extend = function(obj, src) {
    Object.keys(src).forEach(function(key) {
      obj[key] = src[key];
    });
    return obj;
  };

  helper.omit = function(obj, keys) {
    return Object.keys(obj).reduce(function(ret, key) {
      if (keys.indexOf(key) === -1) {
        ret[key] = obj[key];
      }
      return ret;
    }, {});
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

  helper.find = function(array, callback) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (callback(array[i], i, array)) {
        return array[i];
      }
    }
    return null;
  };

  helper.findLast = function(array, callback) {
    for (var i = array.length - 1; i >= 0; i--) {
      if (callback(array[i], i, array)) {
        return array[i];
      }
    }
    return null;
  };

  helper.flatten = function(array) {
    return Array.prototype.concat.apply([], array);
  };

  helper.wrapper = function() {
    var Wrapper = function(self, wrapper) {
      return Object.defineProperty(wrapper, 'unwrap', { value: Wrapper.unwrap.bind(self) });
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
