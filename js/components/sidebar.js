(function(app) {
  'use strict';

  var IScroll = require('iscroll');
  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var SidebarModule = app.SidebarModule || require('./sidebar-module.js');

  var SidebarHeader = helper.inherits(function(props) {
    SidebarHeader.super_.call(this, props);

    this.registerSearchInputFocusListener();
    this.registerSearchInputInputListener();
  }, Component);

  SidebarHeader.prototype.searchInputElement = function() {
    return dom.child(this.element(), 0);
  };

  SidebarHeader.prototype.searchText = function() {
    return dom.value(this.searchInputElement());
  };

  SidebarHeader.prototype.registerSearchInputFocusListener = function() {
    var searchInputElement = this.searchInputElement();
    var isFocused = dom.isFocused(searchInputElement);

    dom.on(searchInputElement, dom.eventType('start'), function() {
      isFocused = dom.isFocused(searchInputElement);
    });

    dom.on(searchInputElement, 'click', function() {
      if (!isFocused && !dom.hasSelection(searchInputElement)) {
        dom.selectAll(searchInputElement);
      }
    });
  };

  SidebarHeader.prototype.registerSearchInputInputListener = function() {
    dom.on(this.searchInputElement(), 'input', function() {
      this.markDirty();
    }.bind(this));
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

    dom.on(this.element(), dom.eventType('start'), SidebarContent.prototype.onpoint.bind(this));
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
    this.markDirty();
  };

  SidebarContent.prototype.clear = function() {
    this.modules().forEach(function(module) {
      module.delete();
    });
    this.modules([]);
  };

  SidebarContent.prototype.scrollEnabled = function(enabled) {
    if (enabled) {
      this.scrollable().enable();
    } else {
      this.scrollable().disable();
    }
  };

  SidebarContent.prototype.redraw = function() {
    // XXX: zero timeout to wait for the repaint of iScroll
    setTimeout(function() {
      this.scrollable().refresh();
    }.bind(this), 0);
  };

  SidebarContent.prototype.onpoint = function() {
    dom.removeFocus();
  };

  var SidebarRelation = helper.inherits(function(props) {
    SidebarRelation.super_.call(this);

    this.header = props.header;
    this.content = props.content;
    this.moduleDataSearcher = props.moduleDataSearcher;
  }, jCore.Relation);

  var Sidebar = helper.inherits(function(props) {
    Sidebar.super_.call(this, props);

    this.dragCount = this.prop(0);

    this.header = new SidebarHeader({
      element: this.headerElement(),
    });

    this.content = new SidebarContent({
      element: this.contentElement(),
      dragStarter: Sidebar.prototype.dragStarter.bind(this),
      dragEnder: Sidebar.prototype.dragEnder.bind(this),
      dropper: props.moduleDropper,
    });

    this.relation = new SidebarRelation({
      header: this.header,
      content: this.content,
      moduleDataSearcher: props.moduleDataSearcher,
    });

    this.moduleDragStarter = props.moduleDragStarter;
    this.moduleDragEnder = props.moduleDragEnder;
  }, Component);

  Sidebar.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  Sidebar.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
  };

  Sidebar.prototype.incrementDragCount = function() {
    this.dragCount(this.dragCount() + 1);
  };

  Sidebar.prototype.decrementDragCount = function() {
    this.dragCount(this.dragCount() - 1);
  };

  Sidebar.prototype.redraw = function() {
    this.redrawDragCount();
  };

  Sidebar.prototype.redrawDragCount = function() {
    var dragCount = this.dragCount();
    var cache = this.cache();

    if (dragCount === cache.dragCount) {
      return;
    }

    this.content.scrollEnabled(dragCount === 0);
    cache.dragCount = dragCount;
  };

  Sidebar.prototype.dragStarter = function() {
    this.incrementDragCount();
    this.moduleDragStarter();
  };

  Sidebar.prototype.dragEnder = function() {
    this.decrementDragCount();
    this.moduleDragEnder();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
  } else {
    app.Sidebar = Sidebar;
  }
})(this.app || (this.app = {}));
