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

  if (typeof module !== 'undefined' && module.exports)
    module.exports = helper;
  else
    app.helper = helper;
})(this.app || (this.app = {}));
