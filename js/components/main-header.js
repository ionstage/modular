(function(app) {
  'use strict';

  var Component = app.Component || require('./component.js');
  var LoadButton = app.LoadButton || require('./load-button.js');
  var SaveButton = app.SaveButton || require('./save-button.js');
  var SidebarToggleButton = app.SidebarToggleButton || require('./sidebar-toggle-button.js');

  var MainHeader = Component.inherits(function(props) {
    this.sidebarToggleButton = new SidebarToggleButton({
      element: this.childElement('.sidebar-toggle-button'),
      toggler: props.sidebarToggler,
    });

    this.loadButton = new LoadButton({
      element: this.childElement('.load-button'),
      loader: props.fileLoader,
    });

    this.saveButton = new SaveButton({
      element: this.childElement('.save-button'),
      saver: props.fileSaver,
    });
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainHeader;
  } else {
    app.MainHeader = MainHeader;
  }
})(this.app || (this.app = {}));
