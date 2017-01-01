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

  Component.prototype.redrawState = function(key, className) {
    var cache = this.cache();
    var value = this[key]();

    if (value === cache[key]) {
      return;
    }

    dom.toggleClass(this.element(), className, value);
    cache[key] = value;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Component;
  } else {
    app.Component = Component;
  }
})(this.app || (this.app = {}));
