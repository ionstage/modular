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

    this.header = new ContentHeader({
      element: this.headerElement(),
      sidebarCollapser: props.sidebarCollapser,
      sidebarExpander: props.sidebarExpander,
      fileLoader: Content.prototype.fileLoader.bind(this),
      fileSaver: Content.prototype.fileSaver.bind(this),
    });

    this.moduleContainer = new ModuleContainer({
      element: this.moduleContainerElement(),
      dragStarter: Content.prototype.dragStarter.bind(this),
      dragEnder: Content.prototype.dragEnder.bind(this),
    });

    this.moduleDragStarter = props.moduleDragStarter;
    this.moduleDragEnder = props.moduleDragEnder;
  }, Component);

  Content.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  Content.prototype.moduleContainerElement = function() {
    return dom.child(this.element(), 1);
  };

  Content.prototype.disabled = function(value) {
    this.header.disabled(value);
    this.moduleContainer.disabled(value);
  };

  Content.prototype.redraw = function() {
    this.header.redraw();
    this.moduleContainer.redraw();
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

  Content.prototype.dragStarter = function() {
    this.moduleContainer.updateRetainer();
    this.moduleDragStarter();
  };

  Content.prototype.dragEnder = function() {
    this.moduleContainer.updateRetainer();
    this.moduleDragEnder();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Content;
  } else {
    app.Content = Content;
  }
})(this.app || (this.app = {}));
