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

    this.disabled = this.prop(false);

    this.header = new ContentHeader({
      element: this.headerElement(),
      sidebarCollapser: props.sidebarCollapser,
      sidebarExpander: props.sidebarExpander,
      fileLoader: Content.prototype.fileLoader.bind(this),
      fileSaver: Content.prototype.fileSaver.bind(this),
    });

    this.moduleContainer = new ModuleContainer({
      element: this.moduleContainerElement(),
      moduleDragStarter: props.moduleDragStarter,
      moduleDragEnder: props.moduleDragEnder,
    });
  }, Component);

  Content.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  Content.prototype.moduleContainerElement = function() {
    return dom.child(this.element(), 1);
  };

  Content.prototype.loadJSON = function(text) {
    var data = JSON.parse(text);
    this.moduleContainer.clear();
    return this.moduleContainer.load(data);
  };

  Content.prototype.loadUrl = function(url) {
    return dom.ajax({
      type: 'GET',
      url: url,
    }).then(function(text) {
      return this.loadJSON(text);
    }.bind(this));
  };

  Content.prototype.loadModuleByClientPosition = function(props, visiblePortNames) {
    return this.moduleContainer.loadModuleByClientPosition(props, visiblePortNames).catch(function(e) {
      if (!(e instanceof RangeError)) {
        throw e;
      }
    });
  };

  Content.prototype.redraw = function() {
    this.redrawToggleClass('disabled', 'disabled');
    this.header.redraw();
    this.moduleContainer.redraw();
  };

  Content.prototype.fileLoader = function(file) {
    this.disabled(true);
    dom.load(file).then(function(text) {
      return this.loadJSON(text);
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Content;
  } else {
    app.Content = Content;
  }
})(this.app || (this.app = {}));
