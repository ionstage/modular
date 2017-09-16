(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var EntryCollection = app.EntryCollection || require('../collections/entry-collection.js');
  var SidebarContent = app.SidebarContent || require('./sidebar-content.js');
  var SidebarHeader = app.SidebarHeader || require('./sidebar-header.js');

  var Sidebar = Component.inherits(function(props) {
    this.disabled = this.prop(true);
    this.dragCount = this.prop(0);
    this.entryCollection = new EntryCollection({ jsonLoader: dom.loadJSON });

    this.header = new SidebarHeader({
      element: this.childElement('.sidebar-header'),
      searcher: Sidebar.prototype.searcher.bind(this),
    });

    this.content = new SidebarContent({
      element: this.childElement('.sidebar-content'),
      dragStarter: Sidebar.prototype.dragStarter.bind(this),
      dragEnder: Sidebar.prototype.dragEnder.bind(this),
      dropper: props.moduleDropper,
    });

    this.moduleDragStarter = props.moduleDragStarter;
    this.moduleDragEnder = props.moduleDragEnder;
  });

  Sidebar.prototype.scrollEnabled = function() {
    return (this.dragCount() === 0);
  };

  Sidebar.prototype.incrementDragCount = function() {
    this.dragCount(this.dragCount() + 1);
  };

  Sidebar.prototype.decrementDragCount = function() {
    this.dragCount(this.dragCount() - 1);
  };

  Sidebar.prototype.loadEntries = function() {
    return this.entryCollection.load().then(function() {
      this.header.loadSearchText();
    }.bind(this));
  };

  Sidebar.prototype.entry = function(name) {
    return this.entryCollection.get(name);
  };

  Sidebar.prototype.redraw = function() {
    this.redrawBy('disabled', function(disabled) {
      dom.toggleClass(this.element(), 'disabled', disabled);
    });

    this.redrawBy('scrollEnabled', function(scrollEnabled) {
      this.content.scrollEnabled(scrollEnabled);
    });
  };

  Sidebar.prototype.searcher = function(text) {
    var entries = this.entryCollection.search(text);
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
