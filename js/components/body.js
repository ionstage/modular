(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var Content = app.Content || require('./content.js');
  var Sidebar = app.Sidebar || require('./sidebar.js');

  var ModuleData = function(props) {
    this.label = props.label;
    this.description = props.description;
    this.src = props.src;
    this.visiblePortNames = props.visiblePortNames;
  };

  var Body = helper.inherits(function() {
    Body.super_.call(this, { element: dom.body() });

    this.dragCount = this.prop(0);

    this.content = new Content({
      element: dom.el('.content'),
      sidebarCollapser: Body.prototype.sidebarCollapser.bind(this),
      sidebarExpander: Body.prototype.sidebarExpander.bind(this),
      moduleDragStarter: Body.prototype.moduleDragStarter.bind(this),
      moduleDragEnder: Body.prototype.moduleDragEnder.bind(this),
    });

    this.sidebar = new Sidebar({
      element: dom.el('.sidebar'),
      moduleDragStarter: Body.prototype.moduleDragStarter.bind(this),
      moduleDragEnder: Body.prototype.moduleDragEnder.bind(this),
      moduleDropper: Body.prototype.moduleDropper.bind(this),
    });

    dom.ready(Body.prototype.onready.bind(this));
  }, Component);

  Body.prototype.incrementDragCount = function() {
    this.dragCount(this.dragCount() + 1);
  };

  Body.prototype.decrementDragCount = function() {
    this.dragCount(this.dragCount() - 1);
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
  };

  Body.prototype.sidebarCollapser = function() {
    return new Promise(function(resolve, reject) {
      var element = this.element();

      var ontransitionend = function() {
        dom.off(element, 'transitionend', ontransitionend);
        resolve();
      };

      dom.on(element, 'transitionend', ontransitionend);
      dom.addClass(element, 'no-sidebar');
    }.bind(this));
  };

  Body.prototype.sidebarExpander = function() {
    return new Promise(function(resolve, reject) {
      var element = this.element();

      var ontransitionend = function() {
        dom.off(element, 'transitionend', ontransitionend);
        resolve();
      };

      dom.on(element, 'transitionend', ontransitionend);
      dom.removeClass(element, 'no-sidebar');
    }.bind(this));
  };

  Body.prototype.moduleDragStarter = function() {
    this.incrementDragCount();
  };

  Body.prototype.moduleDragEnder = function() {
    this.decrementDragCount();
  };

  Body.prototype.moduleDropper = function(name, x, y) {
    /* TODO: load dropped module */
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Body;
  } else {
    app.Body = Body;
  }
})(this.app || (this.app = {}));
