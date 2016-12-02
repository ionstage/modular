(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');

  var SidebarToggleButton = helper.inherits(function(props) {
    SidebarToggleButton.super_.call(this, props);

    this.type = this.prop(SidebarToggleButton.TYPE_COLLAPSE);

    this.collapser = props.collapser;
    this.expander = props.expander;
  }, Button);

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

  SidebarToggleButton.prototype.redraw = function() {
    SidebarToggleButton.super_.prototype.redraw.call(this);
    this.redrawType();
  };

  SidebarToggleButton.prototype.redrawType = function() {
    var type = this.type();
    var cache = this.cache();

    if (type === cache.type)
      return;

    dom.data(this.element(), 'type', type);
    cache.type = type;
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

  SidebarToggleButton.TYPE_COLLAPSE = 'collapse';
  SidebarToggleButton.TYPE_EXPAND = 'expand';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = SidebarToggleButton;
  else
    app.SidebarToggleButton = SidebarToggleButton;
})(this.app || (this.app = {}));
