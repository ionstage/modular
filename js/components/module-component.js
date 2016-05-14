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
      dom.addClass(element, 'module');
      dom.html(element, ModuleComponent.MODULE_HTML);
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

  ModuleComponent.MODULE_HTML = [
    '<div class="module-header">',
      '<div class="module-header-title"></div>',
      '<div class="module-header-delete-button"></div>',
    '</div>',
    '<div class="module-content">',
      '<iframe class="module-component"></iframe>',
      '<div class="module-port-list"></div>',
    '</div>',
    '<div class="module-footer">',
      '<img class="module-footer-icon" src="images/caret-down.svg">',
      '<select class="module-port-select">',
        '<optgroup label="Property"></optgroup>',
        '<optgroup label="Event"></optgroup>',
      '</select>',
    '</div>'
  ].join('');

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModuleComponent;
  else
    app.ModuleComponent = ModuleComponent;
})(this.app || (this.app = {}));
