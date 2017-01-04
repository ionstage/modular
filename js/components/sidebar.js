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

  SidebarModule.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element) {
      return;
    }

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

  var Sidebar = helper.inherits(function(props) {
    Sidebar.super_.call(this, props);
  }, Component);

  Sidebar.prototype.searchInputElement = function() {
    return dom.child(this.element(), 0, 0);
  };

  Sidebar.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
  } else {
    app.Sidebar = Sidebar;
  }
})(this.app || (this.app = {}));
