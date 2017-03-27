(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var Content = app.Content || require('./content.js');
  var ModuleEntryCollection = app.ModuleEntryCollection || require('../collections/module-entry-collection.js');
  var Sidebar = app.Sidebar || require('./sidebar.js');

  var Body = helper.inherits(function() {
    Body.super_.call(this, { element: dom.body() });

    this.dragCount = this.prop(0);

    this.moduleEntryCollection = new ModuleEntryCollection();

    this.sidebar = new Sidebar({
      element: dom.el('.sidebar'),
      moduleDragStarter: Body.prototype.moduleDragStarter.bind(this),
      moduleDragEnder: Body.prototype.moduleDragEnder.bind(this),
      moduleDropper: Body.prototype.moduleDropper.bind(this),
      moduleEntrySearcher: Body.prototype.moduleEntrySearcher.bind(this),
    });

    this.content = new Content({
      element: dom.el('.content'),
      sidebarCollapser: Body.prototype.sidebarCollapser.bind(this),
      sidebarExpander: Body.prototype.sidebarExpander.bind(this),
      moduleDragStarter: Body.prototype.moduleDragStarter.bind(this),
      moduleDragEnder: Body.prototype.moduleDragEnder.bind(this),
    });

    dom.ready(Body.prototype.onready.bind(this));
  }, Component);

  Body.prototype.incrementDragCount = function() {
    this.dragCount(this.dragCount() + 1);
  };

  Body.prototype.decrementDragCount = function() {
    this.dragCount(this.dragCount() - 1);
  };

  Body.prototype.currentDemoName = function() {
    return dom.urlQuery(dom.location()).demo || '';
  };

  Body.prototype.loadDemo = function(name) {
    return Promise.resolve().then(function() {
      if (name) {
        return this.content.loadUrl('./demos/' + name + '.json');
      }
    }.bind(this));
  };

  Body.prototype.redraw = function() {
    this.redrawDragCount();
  };

  Body.prototype.redrawDragCount = function() {
    var dragCount = this.dragCount();
    var cache = this.cache();

    if (dragCount === cache.dragCount) {
      return;
    }

    dom.toggleClass(this.element(), 'module-dragging', dragCount > 0);
    cache.dragCount = dragCount;
  };

  Body.prototype.onready = function() {
    this.content.redraw();
    this.moduleEntryCollection.load().then(function() {
      return this.loadDemo(this.currentDemoName());
    }.bind(this)).catch(function(e) {
      alert(e);
    }).then(function() {
      this.sidebar.searchEnabled(true);
    }.bind(this));
  };

  Body.prototype.sidebarCollapser = function() {
    return dom.transition(this.element(), function() {
      dom.addClass(this.element(), 'no-sidebar');
    }.bind(this));
  };

  Body.prototype.sidebarExpander = function() {
    return dom.transition(this.element(), function() {
      dom.removeClass(this.element(), 'no-sidebar');
    }.bind(this));
  };

  Body.prototype.moduleDragStarter = function() {
    this.incrementDragCount();
  };

  Body.prototype.moduleDragEnder = function() {
    this.decrementDragCount();
  };

  Body.prototype.moduleDropper = function(name, x, y) {
    var moduleEntry = this.moduleEntryCollection.get(name);
    this.content.loadModuleByClientPosition({
      title: moduleEntry.label,
      name: name,
      x: x,
      y: y,
    }, moduleEntry.visiblePortNames);
  };

  Body.prototype.moduleEntrySearcher = function(searchText) {
    return this.moduleEntryCollection.search(searchText);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Body;
  } else {
    app.Body = Body;
  }
})(this.app || (this.app = {}));
