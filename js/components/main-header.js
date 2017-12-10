(function(app) {
  'use strict';

  var jCore = require('jcore');
  var Button = app.Button || require('./button.js');
  var LoadButton = app.LoadButton || require('./load-button.js');
  var ToggleButton = app.ToggleButton || require('./toggle-button.js');

  var MainHeader = jCore.Component.inherits(function(props) {
    this.sidebarToggleButton = new ToggleButton({ element: this.findElement('.sidebar-toggle-button') });
    this.loadButton = new LoadButton({ element: this.findElement('.load-button') });
    this.saveButton = new Button({ element: this.findElement('.save-button') });
  });

  MainHeader.prototype.oninit = function() {
    this.sidebarToggleButton.on('toggle', this.emit.bind(this, 'sidebartoggle'));
    this.loadButton.on('load', this.emit.bind(this, 'load'));
    this.saveButton.on('tap', this.emit.bind(this, 'save'));
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainHeader;
  } else {
    app.MainHeader = MainHeader;
  }
})(this.app || (this.app = {}));
