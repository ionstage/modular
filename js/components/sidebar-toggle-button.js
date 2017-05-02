(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');

  var SidebarToggleButton = Button.inherits(function(props) {
    this.type = this.prop(SidebarToggleButton.TYPE_COLLAPSE);

    this.collapser = props.collapser;
    this.expander = props.expander;
  });

  SidebarToggleButton.prototype.toggler = (function() {
    var map = { collapse: 'collapser', expand: 'expander' };
    return function() {
      return this[map[this.type()]]();
    };
  })();

  SidebarToggleButton.prototype.switchType = (function() {
    var map = { collapse: 'expand', expand: 'collapse' };
    return function() {
      this.type(map[this.type()]);
    };
  })();

  SidebarToggleButton.prototype.ontap = function() {
    this.disabled(true);
    this.toggler().then(function() {
      this.switchType();
      this.disabled(false);
    }.bind(this)).catch(function() {
      this.disabled(false);
    }.bind(this));
  };

  SidebarToggleButton.prototype.onredraw = function() {
    this.redrawProp('type', function(type) {
      dom.data(this.element(), 'type', type);
    });
  };

  SidebarToggleButton.TYPE_COLLAPSE = 'collapse';
  SidebarToggleButton.TYPE_EXPAND = 'expand';

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarToggleButton;
  } else {
    app.SidebarToggleButton = SidebarToggleButton;
  }
})(this.app || (this.app = {}));
