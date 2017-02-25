(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Component = helper.inherits(function(props) {
    Component.super_.call(this);

    this.element = this.prop(props.element);
    this.cache = this.prop({});
  }, jCore.Component);

  Component.prototype.needsUpdate = function(keys) {
    return keys.some(function(key) {
      var cache = this.cache();
      var value = this[key]();
      return (value !== cache[key]);
    }.bind(this));
  };

  Component.prototype.values = function(keys) {
    return keys.map(function(key) {
      return this[key]();
    }.bind(this))
  };

  Component.prototype.updateCache = function(keys) {
    keys.forEach(function(key) {
      var cache = this.cache();
      var value = this[key]();
      cache[key] = value;
    }.bind(this));
  };

  Component.prototype.redrawProp = function() {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();

    if (this.needsUpdate(args)) {
      callback.apply(this, this.values(args));
      this.updateCache(args);
    }
  };

  Component.prototype.redrawToggleClass = function(key, className) {
    this.redrawProp(key, function(value) {
      dom.toggleClass(this.element(), className, value);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Component;
  } else {
    app.Component = Component;
  }
})(this.app || (this.app = {}));
