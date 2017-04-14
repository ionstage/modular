(function(app) {
  'use strict';

  var FileSaver = require('file-saver');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var MainContent = app.MainContent || require('./main-content.js');
  var MainHeader = app.MainHeader || require('./main-header.js');

  var Main = helper.inherits(function(props) {
    Main.super_.call(this, props);

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
  }, Component);

  Main.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  Main.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
  };

  Main.prototype.loadJSON = function(text) {
    var data = JSON.parse(text);
    this.content.clear();
    return this.content.load(data);
  };

  Main.prototype.loadUrl = function(url) {
    return dom.ajax({
      type: 'GET',
      url: url,
    }).then(function(text) {
      return this.loadJSON(text);
    }.bind(this));
  };

  Main.prototype.loadModuleByClientPosition = function(props, visiblePortNames) {
    return this.content.loadModuleByClientPosition(props, visiblePortNames).catch(function(e) {
      if (!(e instanceof RangeError)) {
        throw e;
      }
    });
  };

  Main.prototype.redraw = function() {
    this.redrawToggleClass('disabled', 'disabled');
    this.redrawToggleClass('isFullWidth', 'full-width');
    this.header.redraw();
    this.content.redraw();
  };

  Main.prototype.fileLoader = function(file) {
    this.disabled(true);
    dom.load(file).then(function(text) {
      return this.loadJSON(text);
    }.bind(this)).catch(function(e) {
      alert(e);
    }).then(function() {
      this.disabled(false);
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