(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var Main = app.Main || require('./main.js');
  var Sidebar = app.Sidebar || require('./sidebar.js');

  var Body = Component.inherits(function(props) {
    this.dragCount = this.prop(0);
    this.sidebar = new Sidebar({ element: this.childElement('.sidebar') });
    this.main = new Main({ element: this.childElement('.main') });
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

  Body.prototype.currentDemoName = function() {
    return dom.urlQuery(dom.location()).demo || '';
  };

  Body.prototype.demoUrl = function(name) {
    return 'demos/' + name + '.json';
  };

  Body.prototype.loadModule = function(name, x, y) {
    var point = this.main.contentLocalPoint({ x: x, y: y });
    if (point.x < 0 || point.y < 0) {
      return;
    }

    var entry = this.sidebar.entry(name);
    this.main.loadModule(helper.extend({
      title: entry.label,
      name: name,
    }, point), entry.visiblePortNames);
  };

  Body.prototype.loadDemo = function(name) {
    return (name ? this.main.loadUrl(this.demoUrl(name)) : Promise.resolve());
  };

  Body.prototype.oninit = function() {
    dom.ready(Body.prototype.onready.bind(this));
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
    this.redrawBy('isDragging', function(isDragging) {
      dom.toggleClass(this.element(), 'dragging', isDragging);
    });
  };

  Body.prototype.onready = function() {
    this.disabled(true);
    this.sidebar.loadEntries().then(function() {
      return this.loadDemo(this.currentDemoName());
    }.bind(this)).catch(function(e) {
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

  Body.prototype.ondrop = function(name, x, y) {
    this.loadModule(name, x, y);
  };

  Body.prototype.onsidebartoggle = function() {
    this.sidebar.disabled(!this.sidebar.disabled());
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
