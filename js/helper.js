(function(app) {
  'use strict';

  var helper = {};

  helper.randomString = function(len) {
    var s = [];
    for (var i = 0, n = Math.floor(len / 7); i < n; i++) {
      s.push(Math.random().toString(36).slice(-7));
    }
    var rem = len % 7;
    if (rem) {
      s.push(Math.random().toString(36).slice(-rem));
    }
    return s.join('');
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
    return (a != null && typeof a.equal === 'function') ? a.equal(b) : (a === b);
  };

  helper.values = function(obj) {
    return Object.keys(obj).map(function(key) {
      return obj[key];
    });
  };

  helper.clone = function(obj) {
    var ret = {};
    for (var key in obj) {
      ret[key] = obj[key];
    }
    return ret;
  };

  helper.extend = function(obj, src) {
    for (var key in src) {
      obj[key] = src[key];
    }
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
    return array.slice().sort(function(a, b) {
      var l = (isCallback ? iteratee(a) : a[iteratee]);
      var r = (isCallback ? iteratee(b) : b[iteratee]);
      if (l > r) {
        return 1;
      } else if (l < r) {
        return -1;
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

  helper.Set = (function() {
    var Set = function() {
      this.data = [];
    };

    Set.prototype.add = function(item) {
      if (!this.has(item)) {
        this.data.push(item);
      }
    };

    Set.prototype.delete = function(item) {
      var data = this.data;
      for (var i = data.length - 1; i >= 0; i--) {
        if (helper.equal(data[i], item)) {
          data.splice(i, 1);
          break;
        }
      }
    };

    Set.prototype.clear = function() {
      this.data = [];
    };

    Set.prototype.has = function(item) {
      return this.data.some(function(dataItem) {
        return helper.equal(dataItem, item);
      });
    };

    Set.prototype.forEach = function(callback) {
      this.data.forEach(function(item) {
        callback(item, item, this);
      }.bind(this));
    };

    return Set;
  })();

  helper.Map = (function() {
    var Map = function() {
      this.data = [];
    };

    Map.prototype.set = function(key, value) {
      var data = this.data;
      for (var i = data.length - 1; i >= 0; i--) {
        var item = data[i];
        if (helper.equal(item[0], key)) {
          // update value
          item[1] = value;
          return;
        }
      }
      // store value
      data.push([key, value]);
    };

    Map.prototype.get = function(key) {
      var item = helper.find(this.data, function(item) {
        return helper.equal(item[0], key);
      });
      return (item ? item[1] : null);
    };

    Map.prototype.delete = function(key) {
      var data = this.data;
      for (var i = data.length - 1; i >= 0; i--) {
        if (helper.equal(data[i][0], key)) {
          data.splice(i, 1);
          break;
        }
      }
    };

    Map.prototype.has = function(key) {
      return this.data.some(function(item) {
        return helper.equal(item[0], key);
      });
    };

    Map.prototype.forEach = function(callback) {
      this.data.forEach(function(item) {
        callback(item[1], item[0], this);
      }.bind(this));
    };

    return Map;
  })();

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
