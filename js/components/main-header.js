(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var LoadButton = app.LoadButton || require('./load-button.js');
  var SaveButton = app.SaveButton || require('./save-button.js');
  var SidebarToggleButton = app.SidebarToggleButton || require('./sidebar-toggle-button.js');

  var MainHeader = helper.inherits(function(props) {
    MainHeader.super_.call(this, props);

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

  MainHeader.prototype.sidebarToggleButtonElement = function() {
    return dom.child(this.element(), 0, 0);
  };

  MainHeader.prototype.loadButtonElement = function() {
    return dom.child(this.element(), 1, 0);
  };

  MainHeader.prototype.saveButtonElement = function() {
    return dom.child(this.element(), 1, 1);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainHeader;
  } else {
    app.MainHeader = MainHeader;
  }
})(this.app || (this.app = {}));
