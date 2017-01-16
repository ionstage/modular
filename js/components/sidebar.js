(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var SidebarModule = app.SidebarModule || require('./sidebar-module.js');

  var SidebarContent = helper.inherits(function(props) {
    SidebarContent.super_.call(this, props);
  }, Component);

  var Sidebar = helper.inherits(function(props) {
    Sidebar.super_.call(this, props);

    this.modules = this.prop([]);
  }, Component);

  Sidebar.prototype.searchInputElement = function() {
    return dom.child(this.element(), 0, 0);
  };

  Sidebar.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
  };

  Sidebar.prototype.appendModule = function(props) {
    var module = new SidebarModule(props);
    this.modules().push(module);
    module.parentElement(this.contentElement());
  };

  Sidebar.prototype.removeAllModules = function() {
    this.modules().forEach(function(module) {
      module.delete();
    });
    this.modules([]);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
  } else {
    app.Sidebar = Sidebar;
  }
})(this.app || (this.app = {}));
