(function(window) {
  'use strict';

  var util = {};

  util.isNumber = function(obj) {
    return (Object.prototype.toString.call(obj) === '[object Number]');
  };

  util.isInteger = function(value) {
    return (util.isNumber(value) && isFinite(value) && Math.floor(value) === value);
  };

  util.toNumber = function(value) {
    if (value == null) {
      return NaN;
    }
    if (util.isNumber(value)) {
      return value;
    }
    try {
      value = JSON.parse(String(value));
    } catch (e) {
      return NaN;
    }
    return (util.isNumber(value) ? value : NaN);
  };

  util.debounce = function(func, delay) {
    var t = 0;
    var ctx = null;
    var args = null;
    return function() {
      ctx = this;
      args = arguments;
      if (t) {
        clearTimeout(t);
      }
      t = setTimeout(function() {
        func.apply(ctx, args);
        t = 0;
        ctx = null;
        args = null;
      }, delay);
    };
  };

  Object.defineProperty(window.modular, 'util', { value: util });
})(this);
