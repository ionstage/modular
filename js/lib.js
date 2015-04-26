(function(global) {
  'use strict';
  var util = (function() {
    var toString = Object.prototype.toString;
    function extend(dest, src) {
      for (var key in src) {
        dest[key] = src[key];
      }
      return dest;
    }
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
    return {
      extend: extend,
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
      camelCase: camelCase
    };
  }());

  var storage = (function() {
    function get(key) {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (e) {
        return null;
      }
    }
    function set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return {
      get: get,
      set: set
    }
  }());

  var support = (function() {
    var isTouchEnabled = ('ontouchstart' in window);
    var isSVGEnabled = !!(document.createElementNS &&
                          document.createElementNS('http://www.w3.org/2000/svg',
                                                   'svg').createSVGRect);
    return {
      touch: isTouchEnabled,
      svg: isSVGEnabled
    };
  }());

  var eventModule = (function() {
    var isArray = Array.isArray;
    function enable(obj) {
      obj._listener = {};
      obj.on = on;
      obj.off = off;
      obj.trigger = trigger;
      return obj;
    }
    function on(type, func) {
      var listners = this._listener[type];
      if (isArray(listners)) {
        listners.push(func);
      } else {
        this._listener[type] = [func];
      }
    }
    function off(type, func) {
      var listners = this._listener[type];
      if (isArray(listners)) {
        if (!func) {
          this._listener[type] = [];
          return;
        }
        var index = listners.indexOf(func);
        if (index !== -1) {
          listners.splice(index, 1);
        }
      }
    }
    function trigger(event) {
      var type = event.type, listeners = this._listener[type];
      if (type && isArray(listeners)) {
        for (var i = 0, len = listeners.length; i < len; i += 1) {
          listeners[i](event);
        }
      }
    }
    return {
      enable: enable
    };
  }());

  global.lib = {
    util: util,
    storage: storage,
    support: support,
    event: eventModule
  };

}(this));