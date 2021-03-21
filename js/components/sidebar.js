(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');
  var EntryCollection = app.EntryCollection || require('../models/entry-collection.js');
  var SidebarContent = app.SidebarContent || require('./sidebar-content.js');
  var SidebarHeader = app.SidebarHeader || require('./sidebar-header.js');

  var Sidebar = jCore.Component.inherits(function() {
    this.disabled = this.prop(true);
    this.dragCount = this.prop(0);
    this.entryCollection = new EntryCollection({ jsonLoader: dom.loadJSON });
    this.header = new SidebarHeader(dom.find(this.el, '.sidebar-header'));
    this.content = new SidebarContent(dom.find(this.el, '.sidebar-content'));
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

  Sidebar.prototype.entry = function(name) {
    return this.entryCollection.get(name);
  };

  Sidebar.prototype.search = function(text) {
    this.content.reload(this.entryCollection.search(text));
  };

  Sidebar.prototype.loadEntries = function() {
    return this.entryCollection.load().then(function() {
      this.header.loadSearchText();
    }.bind(this));
  };

  Sidebar.prototype.oninit = function() {
    this.header.on('search', this.onsearch.bind(this));
    this.content.on('dragstart', this.ondragstart.bind(this));
    this.content.on('dragend', this.ondragend.bind(this));
    this.content.on('drop', this.emit.bind(this, 'drop'));
  };

  Sidebar.prototype.onredraw = function() {
    this.redrawBy('disabled', function(disabled) {
      dom.toggleClass(this.element(), 'disabled', disabled);
    });

    this.redrawBy('scrollEnabled', function(scrollEnabled) {
      this.content.scrollEnabled(scrollEnabled);
    });
  };

  Sidebar.prototype.onsearch = function(text) {
    this.search(text);
  };

  Sidebar.prototype.ondragstart = function() {
    this.incrementDragCount();
    this.emit('dragstart');
  };

  Sidebar.prototype.ondragend = function() {
    this.decrementDragCount();
    this.emit('dragend');
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
  } else {
    app.Sidebar = Sidebar;
  }
})(this.app || (this.app = {}));
