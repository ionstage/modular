(function(app) {
  'use strict';

  var IScroll = require('iscroll');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var SidebarModule = app.SidebarModule || require('./sidebar-module.js');

  var SidebarHeader = helper.inherits(function(props) {
    SidebarHeader.super_.call(this, props);
  }, Component);

  SidebarHeader.prototype.searchInputElement = function() {
    return dom.child(this.element(), 0);
  };

  var SidebarContent = helper.inherits(function(props) {
    SidebarContent.super_.call(this, props);

    this.modules = this.prop([]);
    this.scrollable = this.prop(new IScroll(this.element(), {
      disableMouse: true,
      disablePointer: true,
      fadeScrollbars: dom.supportsTouch(),
      interactiveScrollbars: !dom.supportsTouch(),
      mouseWheel: true,
      scrollbars: true,
    }));

    this.dragStarter = props.dragStarter;
    this.dragEnder = props.dragEnder;
    this.dropper = props.dropper;
  }, Component);

  SidebarContent.prototype.scrollerElement = function() {
    return dom.child(this.element(), 0);
  };

  SidebarContent.prototype.createModule = function(props) {
    return new SidebarModule(helper.extend(helper.clone(props), {
      dragStarter: this.dragStarter,
      dragEnder: this.dragEnder,
      dropper: this.dropper,
    }));
  };

  SidebarContent.prototype.appendModule = function(props) {
    var module = this.createModule(props);
    this.modules().push(module);
    module.parentElement(this.scrollerElement());
  };

  SidebarContent.prototype.clear = function() {
    this.modules().forEach(function(module) {
      module.delete();
    });
    this.modules([]);
  };

  var Sidebar = helper.inherits(function(props) {
    Sidebar.super_.call(this, props);

    this.header = new SidebarHeader({
      element: this.headerElement(),
    });

    this.content = new SidebarContent({
      element: this.contentElement(),
      dragStarter: props.moduleDragStarter,
      dragEnder: props.moduleDragEnder,
      dropper: props.moduleDropper,
    });
  }, Component);

  Sidebar.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
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
