(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');
  var Main = app.Main || require('./main.js');
  var Sidebar = app.Sidebar || require('./sidebar.js');

  var Body = jCore.Component.inherits(function() {
    this.hoverDisabled = this.prop(false);
    this.dragCount = this.prop(0);
    this.sidebar = new Sidebar(dom.find(this.el, '.sidebar'));
    this.main = new Main(dom.find(this.el, '.main'));
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

  Body.prototype.disabled = function(value) {
    this.sidebar.disabled(value);
    this.main.disabled(value);
  };

  Body.prototype.dropModule = function(name, pageX, pageY) {
    var x = pageX - this.main.contentOffsetLeft();
    var y = pageY - this.main.contentOffsetTop();
    if (x >= 0 && y >= 0) {
      this.loadModule(this.sidebar.entry(name), x, y);
    }
  };

  Body.prototype.toggleSidebar = function() {
    this.sidebar.disabled(!this.sidebar.disabled());
  };

  Body.prototype.demoUrl = function(name) {
    return 'demos/' + name + '.json';
  };

  Body.prototype.load = function() {
    return this.sidebar.loadEntries().then(function() {
      return this.loadDemo();
    }.bind(this));
  };

  Body.prototype.loadDemo = function() {
    var name = dom.urlQuery(dom.location(), 'demo');
    return (name ? this.main.loadUrl(this.demoUrl(name)) : Promise.resolve());
  };

  Body.prototype.loadModule = function(entry, x, y) {
    this.main.loadModule({
      title: entry.label,
      name: entry.name,
      x: x,
      y: y,
    }, entry.visiblePortNames);
  };

  Body.prototype.oninit = function() {
    this.hoverDisabled(dom.supportsTouch());
    dom.ready(this.onready.bind(this));
    this.sidebar.on('dragstart', this.ondragstart.bind(this));
    this.sidebar.on('dragend', this.ondragend.bind(this));
    this.sidebar.on('drop', this.ondrop.bind(this));
    this.main.on('sidebartoggle', this.onsidebartoggle.bind(this));
    this.main.on('dragstart', this.ondragstart.bind(this));
    this.main.on('dragend', this.ondragend.bind(this));
    this.main.on('loadstart', this.onloadstart.bind(this));
    this.main.on('loadend', this.onloadend.bind(this));
  };

  Body.prototype.onredraw = function() {
    this.redrawBy('hoverDisabled', function(hoverDisabled) {
      dom.toggleClass(this.element(), 'hover-disabled', hoverDisabled);
    });

    this.redrawBy('isDragging', function(isDragging) {
      dom.toggleClass(this.element(), 'dragging', isDragging);
    });
  };

  Body.prototype.onready = function() {
    this.disabled(true);
    this.load().catch(function(e) {
      alert(e);
    }).then(function() {
      this.disabled(false);
    }.bind(this));
  };

  Body.prototype.ondragstart = function() {
    this.incrementDragCount();
  };

  Body.prototype.ondragend = function() {
    this.decrementDragCount();
  };

  Body.prototype.ondrop = function(name, pageX, pageY) {
    this.dropModule(name, pageX, pageY);
  };

  Body.prototype.onsidebartoggle = function() {
    this.toggleSidebar();
  };

  Body.prototype.onloadstart = function() {
    this.disabled(true);
  };

  Body.prototype.onloadend = function() {
    this.disabled(false);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Body;
  } else {
    app.Body = Body;
  }
})(this.app || (this.app = {}));
