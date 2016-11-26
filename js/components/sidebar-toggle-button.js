(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var SidebarToggleButton = helper.inherits(function(props) {
    SidebarToggleButton.super_.call(this);

    this.type = this.prop(SidebarToggleButton.TYPE_COLLAPSE);
    this.disabled = this.prop(false);
    this.element = this.prop(props.element);
    this.cache = this.prop({});

    this.collapser = props.collapser;
    this.expander = props.expander;
  }, jCore.Component);

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

  SidebarToggleButton.prototype.registerTapListener = function() {
    var target;
    new dom.Draggable({
      element: this.element(),
      onstart: function(x, y, event) {
        target = dom.target(event);
        dom.cancel(event);
        dom.removeFocus();
      },
      onend: function(dx, dy, event) {
        if (dom.target(event) !== target)
          return;

        this.disabled(true);
        this.toggler().then(function() {
          this.switchType();
          this.disabled(false);
        }.bind(this)).catch(function() {
          this.disabled(false);
        }.bind(this));
      }.bind(this)
    });
  };

  SidebarToggleButton.prototype.redraw = function() {
    this.redrawType();
    this.redrawDisabled();
  };

  SidebarToggleButton.prototype.redrawType = function() {
    var type = this.type();
    var cache = this.cache();

    if (type === cache.type)
      return;

    dom.data(this.element(), 'type', type);
    cache.type = type;
  };

  SidebarToggleButton.prototype.redrawDisabled = function() {
    var disabled = this.disabled();
    var cache = this.cache();

    if (disabled === cache.disabled)
      return;

    dom.disabled(this.element(), disabled);
    cache.disabled = disabled;
  };

  SidebarToggleButton.TYPE_COLLAPSE = 'collapse';
  SidebarToggleButton.TYPE_EXPAND = 'expand';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = SidebarToggleButton;
  else
    app.SidebarToggleButton = SidebarToggleButton;
})(this.app || (this.app = {}));
