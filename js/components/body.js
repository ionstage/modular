(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var Main = app.Main || require('./main.js');
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

    this.main = new Main({
      element: dom.el('.main'),
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

  Body.prototype.demoUrl = function(name) {
    return 'demos/' + name + '.json';
  };

  Body.prototype.loadDemo = function() {
    var name = this.currentDemoName();

    if (!name) {
      // no need to load demo
      return Promise.resolve();
    }

    return this.main.loadUrl(this.demoUrl(name));
  };

  Body.prototype.redraw = function() {
    this.redrawDragCount();
  };

  Body.prototype.redrawDragCount = function() {
    this.redrawProp('dragCount', function(dragCount) {
      dom.toggleClass(this.element(), 'module-dragging', dragCount > 0);
    });
  };

  Body.prototype.onready = function() {
    this.moduleEntryCollection.load().then(function() {
      this.sidebar.loadContent();
      return this.loadDemo();
    }.bind(this)).catch(function(e) {
      alert(e);
    }).then(function() {
      this.sidebar.disabled(false);
      this.main.disabled(false);
    }.bind(this));
  };

  Body.prototype.sidebarCollapser = function() {
    return dom.transition(this.element(), function() {
      this.sidebar.disabled(true);
      this.main.isFullWidth(true);
    }.bind(this));
  };

  Body.prototype.sidebarExpander = function() {
    return dom.transition(this.element(), function() {
      this.sidebar.disabled(false);
      this.main.isFullWidth(false);
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
    this.main.loadModuleByClientPosition({
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
