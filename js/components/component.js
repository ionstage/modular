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

  Component.prototype.redrawProp = function() {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();

    var needsUpdate = args.some(function(arg) {
      var cache = this.cache();
      var value = this[arg]();
      return (value !== cache[arg]);
    }.bind(this));

    if (!needsUpdate) {
      return;
    }

    callback.apply(null, args.map(function(arg) {
      return this[arg]();
    }.bind(this)));

    args.forEach(function(arg) {
      var cache = this.cache();
      var value = this[arg]();
      cache[arg] = value;
    }.bind(this));
  };

  Component.prototype.redrawToggleClass = function(key, className) {
    this.redrawProp(key, function(value) {
      dom.toggleClass(this.element(), className, value);
    }.bind(this));
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Component;
  } else {
    app.Component = Component;
  }
})(this.app || (this.app = {}));
