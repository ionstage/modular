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
      element: this.headerElement(),
      sidebarCollapser: props.sidebarCollapser,
      sidebarExpander: props.sidebarExpander,
      fileLoader: Main.prototype.fileLoader.bind(this),
      fileSaver: Main.prototype.fileSaver.bind(this),
    });

    this.content = new MainContent({
      element: this.contentElement(),
      moduleDragStarter: props.moduleDragStarter,
      moduleDragEnder: props.moduleDragEnder,
    });

    this.loadStarter = props.loadStarter;
    this.loadEnder = props.loadEnder;
  });

  Main.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  Main.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
  };

  Main.prototype.contentLocalPoint = function(point) {
    return this.content.localPoint(point);
  };

  Main.prototype.loadContent = function(data) {
    this.content.clear();
    return this.content.load(data);
  };

  Main.prototype.loadUrl = function(url) {
    return dom.loadJSON(url).then(function(data) {
      return this.loadContent(data);
    }.bind(this));
  };

  Main.prototype.loadModule = function(props, visiblePortNames) {
    return this.content.loadModule(props, visiblePortNames);
  };

  Main.prototype.redraw = function() {
    this.redrawToggleClass('disabled', 'disabled');
    this.redrawToggleClass('isFullWidth', 'full-width');
  };

  Main.prototype.fileLoader = function(file) {
    this.loadStarter();
    dom.readFile(file).then(function(text) {
      return this.loadContent(JSON.parse(text));
    }.bind(this)).catch(function(e) {
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
