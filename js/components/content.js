(function(app) {
  'use strict';

  var FileSaver = require('file-saver');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var ContentHeader = app.ContentHeader || require('./content-header.js');
  var ModuleContainer = app.ModuleContainer || require('./module-container.js');

  var Content = helper.inherits(function(props) {
    Content.super_.call(this, props);

    this.contentHeader = new ContentHeader({
      element: this.contentHeaderElement(),
      sidebarCollapser: props.sidebarCollapser,
      sidebarExpander: props.sidebarExpander,
      fileLoader: Content.prototype.fileLoader.bind(this),
      fileSaver: Content.prototype.fileSaver.bind(this),
    });

    this.moduleContainer = new ModuleContainer({
      element: this.moduleContainerElement(),
    });
  }, Component);

  Content.prototype.contentHeaderElement = function() {
    return dom.child(this.element(), 0);
  };

  Content.prototype.moduleContainerElement = function() {
    return dom.child(this.element(), 1);
  };

  Content.prototype.disabled = function(value) {
    this.contentHeader.disabled(value);
    this.moduleContainer.disabled(value);
  };

  Content.prototype.fileLoader = function(file) {
    this.disabled(true);
    dom.load(file).then(function(text) {
      var data = JSON.parse(text);
      this.moduleContainer.clear();
      this.moduleContainer.load(data);
    }.bind(this)).catch(function(e) {
      alert(e);
    }).then(function() {
      this.disabled(false);
    }.bind(this));
  };

  Content.prototype.fileSaver = function() {
    var text = JSON.stringify(this.moduleContainer.toData());
    var blob = new Blob([text], { type: 'application/json' });
    FileSaver.saveAs(blob, 'download.json');
  };

  Content.prototype.redraw = function() {
    this.contentHeader.redraw();
    this.moduleContainer.redraw();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Content;
  } else {
    app.Content = Content;
  }
})(this.app || (this.app = {}));
