(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var SidebarContent = app.SidebarContent || require('./sidebar-content.js');
  var SidebarHeader = app.SidebarHeader || require('./sidebar-header.js');

  var Sidebar = Component.inherits(function(props) {
    this.disabled = this.prop(true);
    this.dragCount = this.prop(0);

    this.header = new SidebarHeader({
      element: this.headerElement(),
      searcher: Sidebar.prototype.searcher.bind(this),
    });

    this.content = new SidebarContent({
      element: this.contentElement(),
      dragStarter: Sidebar.prototype.dragStarter.bind(this),
      dragEnder: Sidebar.prototype.dragEnder.bind(this),
      dropper: props.moduleDropper,
    });

    this.entrySearcher = props.entrySearcher;
    this.moduleDragStarter = props.moduleDragStarter;
    this.moduleDragEnder = props.moduleDragEnder;
  });

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

  Sidebar.prototype.loadContent = function() {
    this.header.loadSearchText();
  };

  Sidebar.prototype.redraw = function() {
    this.redrawDOMToggleClassBy('disabled', 'disabled');
    this.redrawDragCount();
  };

  Sidebar.prototype.redrawDragCount = function() {
    this.redrawBy('dragCount', function(dragCount) {
      this.content.scrollEnabled(dragCount === 0);
    });
  };

  Sidebar.prototype.searcher = function(text) {
    var entries = this.entrySearcher(text);
    this.content.setModules(entries);
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
