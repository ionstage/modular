(function(app) {
  'use strict';

  var IScroll = require('iscroll');
  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');
  var SidebarModule = app.SidebarModule || require('./sidebar-module.js');

  var SidebarContent = jCore.Component.inherits(function(props) {
    this.modules = [];
    this.scrollable = new SidebarContent.Scrollable({ element: props.element });
  });

  SidebarContent.prototype.createModule = function(props) {
    var module = new SidebarModule(props);
    module.on('dragstart', this.emit.bind(this, 'dragstart'));
    module.on('dragend', this.emit.bind(this, 'dragend'));
    module.on('drop', this.emit.bind(this, 'drop'));
    return module;
  };

  SidebarContent.prototype.createModules = function(entries) {
    return entries.map(function(entry) {
      return this.createModule({
        title: entry.label,
        content: entry.description,
        name: entry.name,
      });
    }.bind(this));
  };

  SidebarContent.prototype.reload = function(entries) {
    this.modules.forEach(function(module) {
      module.removeAllListeners();
      module.parentElement(null);
    });
    this.modules = this.createModules(entries).map(function(module) {
      module.parentElement(this.findElement('.sidebar-module-container'));
      return module;
    }.bind(this));
    this.markDirty();
  };

  SidebarContent.prototype.scrollEnabled = function(value) {
    this.scrollable.enabled(value);
  };

  SidebarContent.prototype.oninit = function() {
    dom.on(this.element(), dom.eventType('start'), function() {
      dom.removeFocus();
    });
  };

  SidebarContent.prototype.onredraw = function() {
    this.scrollable.refresh();
  };

  SidebarContent.Scrollable = (function() {
    var Scrollable = function(props) {
      this.iScroll = new IScroll(props.element, this.options());
    };

    Scrollable.prototype.options = function() {
      return {
        disableMouse: true,
        fadeScrollbars: dom.supportsTouch(),
        interactiveScrollbars: !dom.supportsTouch(),
        mouseWheel: true,
        scrollbars: true,
      };
    };

    Scrollable.prototype.enabled = function(value) {
      if (value) {
        this.iScroll.enable();
      } else {
        this.iScroll.disable();
      }
    };

    Scrollable.prototype.refresh = function() {
      // XXX: zero timeout to wait for the repaint of iScroll
      setTimeout(function() {
        this.iScroll.refresh();
      }.bind(this), 0);
    };

    return Scrollable;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarContent;
  } else {
    app.SidebarContent = SidebarContent;
  }
})(this.app || (this.app = {}));
