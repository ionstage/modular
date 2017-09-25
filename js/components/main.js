(function(app) {
  'use strict';

  var FileSaver = require('file-saver');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var MainContent = app.MainContent || require('./main-content.js');
  var MainHeader = app.MainHeader || require('./main-header.js');

  var Main = Component.inherits(function(props) {
    this.disabled = this.prop(true);
    this.isFullWidth = this.prop(false);

    this.header = new MainHeader({
      element: this.childElement('.main-header'),
      sidebarToggleType: this.sidebarToggleType(),
    });

    this.content = new MainContent({ element: this.childElement('.main-content') });
  });

  Main.prototype.sidebarToggleType = function() {
    return (this.isFullWidth() ? 'expand' : 'collapse');
  };

  Main.prototype.contentLocalPoint = function(point) {
    return this.content.localPoint(point);
  };

  Main.prototype.toggleSidebar = function() {
    this.isFullWidth(!this.isFullWidth());
    this.header.sidebarToggleDisabled(true);
  };

  Main.prototype.loadContent = function(data) {
    this.content.clear();
    return this.content.load(data);
  };

  Main.prototype.loadFile = function(file) {
    return dom.readFile(file).then(function(text) {
      return this.loadContent(JSON.parse(text));
    }.bind(this));
  };

  Main.prototype.loadUrl = function(url) {
    return dom.loadJSON(url).then(function(data) {
      return this.loadContent(data);
    }.bind(this));
  };

  Main.prototype.loadModule = function(props, visiblePortNames) {
    return this.content.loadModule(props, visiblePortNames);
  };

  Main.prototype.oninit = function() {
    dom.on(this.element(), 'transitionend', this.ontransitionend.bind(this));
    this.header.on('sidebartoggle', this.onsidebartoggle.bind(this));
    this.header.on('load', this.onload.bind(this));
    this.header.on('save', this.onsave.bind(this));
    this.content.on('dragstart', this.ondragstart.bind(this));
    this.content.on('dragend', this.ondragend.bind(this));
  };

  Main.prototype.onredraw = function() {
    this.redrawBy('disabled', function(disabled) {
      dom.toggleClass(this.element(), 'disabled', disabled);
    });

    this.redrawBy('isFullWidth', function(isFullWidth) {
      dom.toggleClass(this.element(), 'full-width', isFullWidth);
    });
  };

  Main.prototype.ontransitionend = function() {
    this.header.sidebarToggleType(this.sidebarToggleType());
    this.header.sidebarToggleDisabled(false);
  };

  Main.prototype.onsidebartoggle = function() {
    this.toggleSidebar();
    this.emit('sidebartoggle');
  };

  Main.prototype.ondragstart = function() {
    this.emit('dragstart');
  };

  Main.prototype.ondragend = function() {
    this.emit('dragend');
  };

  Main.prototype.onload = function(file) {
    this.emit('loadstart');
    this.loadFile(file).catch(function(e) {
      alert(e);
    }).then(function() {
      this.emit('loadend');
    }.bind(this));
  };

  Main.prototype.onsave = function() {
    var text = JSON.stringify(this.content.toData());
    var blob = new Blob([text], { type: 'application/json' });
    FileSaver.saveAs(blob, 'download.json');
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Main;
  } else {
    app.Main = Main;
  }
})(this.app || (this.app = {}));
