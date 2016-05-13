(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var ModuleComponent = helper.inherits(function() {
    ModuleComponent.super_.call(this);

    this.element = this.prop(null);
    this.parentElement = this.prop(null);
  }, jCore.Component);

  ModuleComponent.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element)
      return;

    // add element
    if (parentElement && !element) {
      element = dom.el('<div>');
      this.element(element);
      dom.append(parentElement, element);
      return;
    }

    // remove element
    if (!parentElement && element) {
      dom.remove(element);
      this.element(null);
      return;
    }
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleComponent;
  else
    app.ModuleComponent = ModuleComponent;
})(this.app || (this.app = {}));
