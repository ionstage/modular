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
    });

    this.loadButton = new LoadButton({ element: this.childElement('.load-button') });
    this.saveButton = new Button({ element: this.childElement('.save-button') });
  });

  MainHeader.prototype.oninit = function() {
    this.sidebarToggleButton.on('tap', this.onsidebartoggle.bind(this));
    this.loadButton.on('load', this.onload.bind(this));
    this.saveButton.on('tap', this.onsave.bind(this));
  };

  MainHeader.prototype.sidebarToggleType = function(value) {
    return this.sidebarToggleButton.type(value);
  };

  MainHeader.prototype.sidebarToggleDisabled = function(value) {
    return this.sidebarToggleButton.disabled(value);
  };

  MainHeader.prototype.onsidebartoggle = function() {
    this.emit('sidebartoggle');
  };

  MainHeader.prototype.onload = function(file) {
    this.emit('load', file);
  };

  MainHeader.prototype.onsave = function() {
    this.emit('save');
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainHeader;
  } else {
    app.MainHeader = MainHeader;
  }
})(this.app || (this.app = {}));
