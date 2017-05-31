(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');

  var SidebarToggleButton = Button.inherits(function(props) {
    this.type = this.prop(SidebarToggleButton.TYPE_COLLAPSE);

    this.collapser = props.collapser;
    this.expander = props.expander;
  });

  SidebarToggleButton.prototype.typeEntry = function() {
    return SidebarToggleButton.TYPE_ENTRY_MAP[this.type()];
  };

  SidebarToggleButton.prototype.toggler = function() {
    var togglerName = this.typeEntry().togglerName;
    return this[togglerName]();
  };

  SidebarToggleButton.prototype.switchType = function() {
    var switchType = this.typeEntry().switchType;
    this.type(switchType);
  };

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

  SidebarToggleButton.TYPE_ENTRY_MAP = (function() {
    var map = {};
    map[SidebarToggleButton.TYPE_COLLAPSE] = {
      togglerName: 'collapser',
      switchType: SidebarToggleButton.TYPE_EXPAND,
    };
    map[SidebarToggleButton.TYPE_EXPAND] = {
      togglerName: 'expander',
      switchType: SidebarToggleButton.TYPE_COLLAPSE,
    };
    return map;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarToggleButton;
  } else {
    app.SidebarToggleButton = SidebarToggleButton;
  }
})(this.app || (this.app = {}));
