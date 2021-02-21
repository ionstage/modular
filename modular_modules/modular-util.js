(function(window) {
  'use strict';

  var util = {};

  util.isNumber = function(obj) {
    return (Object.prototype.toString.call(obj) === '[object Number]');
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
      return (util.isNumber(value) ? value : NaN);
    } catch (e) {
      return NaN;
    }
  };

  util.delay = function(func, delay) {
    return function() {
      var ctx = this;
      var args = arguments;
      setTimeout(function() {
        func.apply(ctx, args);
      }, delay);
    };
  };

  Object.defineProperty(window.modular, 'util', { value: util });
})(this);
