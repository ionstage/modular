(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');

  var SidebarToggleButton = Button.inherits(function(props) {
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

  SidebarToggleButton.prototype.ontap = function() {
    this.disabled(true);
    this.toggle().then(function() {
      this.disabled(false);
    }.bind(this));
  };

  SidebarToggleButton.prototype.onredraw = function() {
    this.redrawProp('type', function(type) {
      dom.data(this.element(), 'type', type);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarToggleButton;
  } else {
    app.SidebarToggleButton = SidebarToggleButton;
  }
})(this.app || (this.app = {}));
