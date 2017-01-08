(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var SidebarModule = helper.inherits(function(props) {
    SidebarModule.super_.call(this, props);

    this.title = this.prop(props.title);
    this.content = this.prop(props.content);
    this.parentElement = this.prop(null);
  }, Component);

  SidebarModule.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  SidebarModule.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
  };

  SidebarModule.prototype.render = function() {
    var element = dom.el('<div>');
    dom.addClass(element, 'module');
    dom.html(element, SidebarModule.TEMPLATE_HTML);
    return element;
  };

  SidebarModule.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element) {
      return;
    }

    // add element
    if (parentElement && !element) {
      this.element(this.render());
      dom.append(parentElement, this.element());
      return;
    }

    // remove element
    if (!parentElement && element) {
      dom.remove(element);
      this.element(null);
      this.cache({});
      return;
    }
  };

  SidebarModule.TEMPLATE_HTML = [
    '<div class="module-header"></div>',
    '<div class="module-content"></div>',
  ].join('');

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarModule;
  } else {
    app.SidebarModule = SidebarModule;
  }
})(this.app || (this.app = {}));
