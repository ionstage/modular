(function(app) {
  'use strict';

  var Button = app.Button || require('./button.js');
  var Component = app.Component || require('./component.js');

  var SidebarToggleButton = Component.inherits(function(props) {
    this.button = new Button({
      element: props.element,
      tapper: SidebarToggleButton.prototype.tapper.bind(this),
    });

    this.sidebarVisible = this.prop(true);
    this.toggler = props.toggler;
  });

  SidebarToggleButton.prototype.type = function() {
    return (this.sidebarVisible() ? 'collapse' : 'expand');
  };

  SidebarToggleButton.prototype.toggle = function() {
    var visible = !this.sidebarVisible();
    return this.toggler(visible).then(function() {
      this.sidebarVisible(visible);
    }.bind(this));
  };

  SidebarToggleButton.prototype.tapper = function() {
    this.button.disabled(true);
    this.toggle().then(function() {
      this.button.disabled(false);
    }.bind(this));
  };

  SidebarToggleButton.prototype.redraw = function() {
    this.redrawDOMDataBy('type', 'type');
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarToggleButton;
  } else {
    app.SidebarToggleButton = SidebarToggleButton;
  }
})(this.app || (this.app = {}));
