(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');
  var Component = app.Component || require('./component.js');

  var SidebarToggleButton = Component.inherits(function(props) {
    this.type = this.prop(props.type);

    this.button = new Button({
      element: props.element,
      tapper: props.toggler,
    });
  });

  SidebarToggleButton.prototype.disabled = function(value) {
    return this.button.disabled(value);
  };

  SidebarToggleButton.prototype.redraw = function() {
    this.redrawBy('type', function(value) {
      dom.data(this.element(), 'type', value);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarToggleButton;
  } else {
    app.SidebarToggleButton = SidebarToggleButton;
  }
})(this.app || (this.app = {}));
