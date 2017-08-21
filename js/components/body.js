(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var Main = app.Main || require('./main.js');
  var EntryCollection = app.EntryCollection || require('../collections/entry-collection.js');
  var Sidebar = app.Sidebar || require('./sidebar.js');

  var Body = Component.inherits(function(props) {
    this.dragCount = this.prop(0);

    this.entryCollection = new EntryCollection({ jsonLoader: dom.loadJSON });

    this.sidebar = new Sidebar({
      element: dom.el('.sidebar'),
      moduleDragStarter: Body.prototype.moduleDragStarter.bind(this),
      moduleDragEnder: Body.prototype.moduleDragEnder.bind(this),
      moduleDropper: Body.prototype.moduleDropper.bind(this),
      entrySearcher: Body.prototype.entrySearcher.bind(this),
    });

    this.main = new Main({
      element: dom.el('.main'),
      sidebarToggler: Body.prototype.sidebarToggler.bind(this),
      moduleDragStarter: Body.prototype.moduleDragStarter.bind(this),
      moduleDragEnder: Body.prototype.moduleDragEnder.bind(this),
      loadStarter: Body.prototype.loadStarter.bind(this),
      loadEnder: Body.prototype.loadEnder.bind(this),
    });

    this.registerReadyListener();
  });

  Body.prototype.isDragging = function() {
    return (this.dragCount() > 0);
  };

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

  Body.prototype.registerReadyListener = function() {
    dom.ready(Body.prototype.onready.bind(this));
  };

  Body.prototype.toggleSidebar = function(visible) {
    return dom.transition(this.element(), function() {
      this.sidebar.disabled(!visible);
      this.main.isFullWidth(!visible);
    }.bind(this));
  };

  Body.prototype.loadDemo = function(name) {
    return (name ? this.main.loadUrl(this.demoUrl(name)) : Promise.resolve());
  };

  Body.prototype.render = function() {
    return dom.body();
  };

  Body.prototype.redraw = function() {
    this.redrawDOMToggleClassBy('isDragging', 'dragging');
  };

  Body.prototype.onready = function() {
    this.loadStarter();
    this.entryCollection.load().then(function() {
      this.sidebar.loadContent();
      return this.loadDemo(this.currentDemoName());
    }.bind(this)).catch(function(e) {
      alert(e);
    }).then(function() {
      this.loadEnder();
    }.bind(this));
  };

  Body.prototype.moduleDragStarter = function() {
    this.incrementDragCount();
  };

  Body.prototype.moduleDragEnder = function() {
    this.decrementDragCount();
  };

  Body.prototype.moduleDropper = function(name, x, y) {
    var point = this.main.contentLocalPoint({ x: x, y: y });
    if (point.x < 0 || point.y < 0) {
      return;
    }

    var entry = this.entryCollection.get(name);
    this.main.loadModule(helper.extend({
      title: entry.label,
      name: name,
    }, point), entry.visiblePortNames);
  };

  Body.prototype.entrySearcher = function(searchText) {
    return this.entryCollection.search(searchText);
  };

  Body.prototype.sidebarToggler = function(visible) {
    return this.toggleSidebar(visible);
  };

  Body.prototype.loadStarter = function() {
    this.sidebar.disabled(true);
    this.main.disabled(true);
  };

  Body.prototype.loadEnder = function() {
    this.sidebar.disabled(false);
    this.main.disabled(false);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Body;
  } else {
    app.Body = Body;
  }
})(this.app || (this.app = {}));
