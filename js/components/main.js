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
      sidebarToggler: props.sidebarToggler,
      fileLoader: Main.prototype.fileLoader.bind(this),
      fileSaver: Main.prototype.fileSaver.bind(this),
    });

    this.content = new MainContent({ element: this.childElement('.main-content') });

    this.loadStarter = props.loadStarter;
    this.loadEnder = props.loadEnder;
  });

  Main.prototype.sidebarToggleType = function() {
    return (this.isFullWidth() ? 'expand' : 'collapse');
  };

  Main.prototype.sidebarToggleDisabled = function(value) {
    return this.header.sidebarToggleDisabled(value);
  };

  Main.prototype.contentLocalPoint = function(point) {
    return this.content.localPoint(point);
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
    dom.on(this.element(), 'transitionend', function() {
      this.header.sidebarToggleType(this.sidebarToggleType());
      this.header.sidebarToggleDisabled(false);
    }.bind(this));

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

  Main.prototype.ondragstart = function() {
    this.emit('dragstart');
  };

  Main.prototype.ondragend = function() {
    this.emit('dragend');
  };

  Main.prototype.fileLoader = function(file) {
    this.loadStarter();
    this.loadFile(file).catch(function(e) {
      alert(e);
    }).then(function() {
      this.loadEnder();
    }.bind(this));
  };

  Main.prototype.fileSaver = function() {
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
