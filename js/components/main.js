(function(app) {
  'use strict';

  var FileSaver = require('file-saver');
  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');
  var MainContent = app.MainContent || require('./main-content.js');
  var MainHeader = app.MainHeader || require('./main-header.js');

  var Main = jCore.Component.inherits(function() {
    this.disabled = this.prop(true);
    this.isFullWidth = this.prop(false);
    this.header = new MainHeader(dom.find(this.el, '.main-header'));
    this.content = new MainContent(dom.find(this.el, '.main-content'));
  });

  Main.prototype.contentOffsetLeft = function() {
    return this.content.offsetLeft();
  };

  Main.prototype.contentOffsetTop = function() {
    return this.content.offsetTop();
  };

  Main.prototype.toggleSidebar = function() {
    this.isFullWidth(!this.isFullWidth());
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

  Main.prototype.loadContent = function(data) {
    this.content.clear();
    return this.content.load(data);
  };

  Main.prototype.loadModule = function(props, visiblePortNames) {
    return this.content.loadModule(props, visiblePortNames);
  };

  Main.prototype.oninit = function() {
    this.header.on('sidebartoggle', this.onsidebartoggle.bind(this));
    this.header.on('load', this.onload.bind(this));
    this.header.on('save', this.onsave.bind(this));
    this.content.on('dragstart', this.emit.bind(this, 'dragstart'));
    this.content.on('dragend', this.emit.bind(this, 'dragend'));
  };

  Main.prototype.onredraw = function() {
    this.redrawBy('disabled', function(disabled) {
      dom.toggleClass(this.el, 'disabled', disabled);
    });

    this.redrawBy('isFullWidth', function(isFullWidth) {
      dom.toggleClass(this.el, 'full-width', isFullWidth);
    });
  };

  Main.prototype.onsidebartoggle = function(done) {
    this.toggleSidebar();
    this.emit('sidebartoggle');
    dom.once(this.el, 'transitionend', function() {
      done();
    });
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
    FileSaver.saveAs(blob, 'Untitled.json');
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Main;
  } else {
    app.Main = Main;
  }
})(this.app || (this.app = {}));
