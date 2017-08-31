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
  });

  SidebarContent.prototype.createModule = function(props) {
    return new SidebarModule(helper.extend(helper.clone(props), {
      parentElement: this.childElement('.sidebar-module-container'),
      dragStarter: this.dragStarter,
      dragEnder: this.dragEnder,
      dropper: this.dropper,
    }));
  };

  SidebarContent.prototype.appendModule = function(props) {
    var module = this.createModule(props);
    module.markDirty();
    this.modules().push(module);
    this.markDirty();
  };

  SidebarContent.prototype.clear = function() {
    this.modules().forEach(function(module) {
      module.delete();
    });
    this.modules([]);
  };

  SidebarContent.prototype.setModules = function(entries) {
    this.clear();
    entries.forEach(function(entry) {
      this.appendModule({
        title: entry.label,
        content: entry.description,
        name: entry.name,
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

  SidebarContent.prototype.oninit = function() {
    dom.on(this.element(), dom.eventType('start'), function() {
      dom.removeFocus();
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarContent;
  } else {
    app.SidebarContent = SidebarContent;
  }
})(this.app || (this.app = {}));
