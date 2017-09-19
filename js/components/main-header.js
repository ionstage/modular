(function(app) {
  'use strict';

  var Button = app.Button || require('./button.js');
  var Component = app.Component || require('./component.js');
  var LoadButton = app.LoadButton || require('./load-button.js');
  var ToggleButton = app.ToggleButton || require('./toggle-button.js');

  var MainHeader = Component.inherits(function(props) {
    this.sidebarToggleButton = new ToggleButton({
      element: this.childElement('.sidebar-toggle-button'),
      type: props.sidebarToggleType,
      toggler: props.sidebarToggler,
    });

    this.loadButton = new LoadButton({
      element: this.childElement('.load-button'),
      loader: props.fileLoader,
    });

    this.saveButton = new Button({
      element: this.childElement('.save-button'),
      tapper: props.fileSaver,
    });
  });

  MainHeader.prototype.sidebarToggleType = function(value) {
    return this.sidebarToggleButton.type(value);
  };

  MainHeader.prototype.sidebarToggleDisabled = function(value) {
    return this.sidebarToggleButton.disabled(value);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainHeader;
  } else {
    app.MainHeader = MainHeader;
  }
})(this.app || (this.app = {}));
