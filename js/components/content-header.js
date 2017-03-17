(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var LoadButton = app.LoadButton || require('./load-button.js');
  var SaveButton = app.SaveButton || require('./save-button.js');
  var SidebarToggleButton = app.SidebarToggleButton || require('./sidebar-toggle-button.js');

  var ContentHeader = helper.inherits(function(props) {
    ContentHeader.super_.call(this, props);

    this.disabled = this.prop(false);

    this.sidebarToggleButton = new SidebarToggleButton({
      element: this.sidebarToggleButtonElement(),
      collapser: props.sidebarCollapser,
      expander: props.sidebarExpander,
    });

    this.loadButton = new LoadButton({
      element: this.loadButtonElement(),
      loader: props.fileLoader,
    });

    this.saveButton = new SaveButton({
      element: this.saveButtonElement(),
      saver: props.fileSaver,
    });
  }, Component);

  ContentHeader.prototype.sidebarToggleButtonElement = function() {
    return dom.child(this.element(), 0);
  };

  ContentHeader.prototype.loadButtonElement = function() {
    return dom.child(this.element(), 1);
  };

  ContentHeader.prototype.saveButtonElement = function() {
    return dom.child(this.element(), 2);
  };

  ContentHeader.prototype.redraw = function() {
    this.sidebarToggleButton.redraw();
    this.redrawToggleClass('disabled', 'disabled');
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentHeader;
  } else {
    app.ContentHeader = ContentHeader;
  }
})(this.app || (this.app = {}));
