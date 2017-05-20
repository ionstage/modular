(function(app) {
  'use strict';

  var IScroll = require('iscroll');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var SidebarModule = app.SidebarModule || require('./sidebar-module.js');

  var SidebarContent = Component.inherits(function(props) {
    this.modules = this.prop([]);

    this.scrollable = new IScroll(this.element(), {
      disableMouse: true,
      disablePointer: true,
      fadeScrollbars: dom.supportsTouch(),
      interactiveScrollbars: !dom.supportsTouch(),
      mouseWheel: true,
      scrollbars: true,
    });

    this.dragStarter = props.dragStarter;
    this.dragEnder = props.dragEnder;
    this.dropper = props.dropper;

    this.registerPointListener();
  });

  SidebarContent.prototype.moduleContainerElement = function() {
    return dom.child(this.element(), 0);
  };

  SidebarContent.prototype.registerPointListener = function() {
    dom.on(this.element(), dom.eventType('start'), function() {
      dom.removeFocus();
    });
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
    module.parentElement(this.moduleContainerElement());
    this.markDirty();
  };

  SidebarContent.prototype.clear = function() {
    this.modules().forEach(function(module) {
      module.delete();
    });
    this.modules([]);
  };

  SidebarContent.prototype.setModules = function(moduleEntries) {
    this.clear();
    moduleEntries.forEach(function(moduleEntry) {
      this.appendModule({
        title: moduleEntry.label,
        content: moduleEntry.description,
        name: moduleEntry.key(),
      });
    }.bind(this));
  };

  SidebarContent.prototype.scrollEnabled = function(enabled) {
    if (enabled) {
      this.scrollable.enable();
    } else {
      this.scrollable.disable();
    }
  };

  SidebarContent.prototype.redraw = function() {
    // XXX: zero timeout to wait for the repaint of iScroll
    setTimeout(function() {
      this.scrollable.refresh();
    }.bind(this), 0);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarContent;
  } else {
    app.SidebarContent = SidebarContent;
  }
})(this.app || (this.app = {}));
