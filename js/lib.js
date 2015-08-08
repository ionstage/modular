(function(global) {
  'use strict';
  var util = (function() {
    var toString = Object.prototype.toString;
    function isObject(obj) {
      return obj === Object(obj);
    }
    var isArray = Array.isArray;
    function isString(obj) {
      return toString.call(obj) == '[object String]';
    }
    function isNumber(obj) {
      return toString.call(obj) == '[object Number]';
    }
    function isBoolean(obj) {
      return obj === true || obj === false ||
             toString.call(obj) == '[object Boolean]';
    }
    function parseObject(obj) {
      if (obj === null || obj === undefined)
        return null;
      if (isObject(obj)) {
        return obj;
      } else {
        var objStr = String(obj);
        try {
          obj = JSON.parse(objStr);
          if (isObject(obj)) {
            return obj;
          } else {
            return null;
          }
        } catch (e) {
          return null;
        }
      }
    }
    function parseArray(obj) {
      obj = parseObject(obj);
      return isArray(obj) ? obj : null;
    }
    function parseString(obj, isFormat) {
      if (obj === null || obj === undefined || obj !== obj)
        return '';
      if (isString(obj)) {
        return obj;
      } else {
        try {
          var str = (isFormat) ? JSON.stringify(obj, null, '  ') :
                                 JSON.stringify(obj);
          return str;
        } catch (e) {
          return String(obj);
        }
      }
    }
    function parseNumber(obj) {
      if (obj === null || obj === undefined)
        return NaN;
      if (isNumber(obj)) {
        return obj;
      } else {
        var objStr = String(obj);
        try {
          obj = JSON.parse(objStr);
          if (isNumber(obj)) {
            return obj;
          } else {
            return NaN;
          }
        } catch (e) {
          return NaN;
        }
      }
    }
    function escape(str) {
      return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
    }
    function camelCase(str, separetor) {
      separetor = separetor || '-';
      var re = new RegExp(separetor + '+(.)?', 'g');
      return str.replace(re, function(match, chr) {
        return chr ? chr.toUpperCase() : '';
      });
    }
    function debounce(func, wait) {
      if (typeof func !== 'function')
        return;
      var updateTimer = null, context, args;
      return function() {
        context = this;
        args = arguments;
        if (updateTimer !== null)
          clearTimeout(updateTimer);
        updateTimer = setTimeout(function() { func.apply(context, args); }, wait);
      };
    }
    return {
      isObject: isObject,
      isArray: isArray,
      isString: isString,
      isNumber: isNumber,
      isBoolean: isBoolean,
      parseObject: parseObject,
      parseArray: parseArray,
      parseString: parseString,
      parseNumber: parseNumber,
      escape: escape,
      camelCase: camelCase,
      debounce: debounce
    };
  }());

  global.lib = {
    util: util
  };

}(this));