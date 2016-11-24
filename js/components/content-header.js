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
  }, jCore.Component);

  SidebarToggleButton.prototype.redraw = function() {
    var cache = this.cache();

    var type = this.type();
    if (type !== cache.type) {
      dom.data(this.element(), 'type', type);
      cache.type = type;
    }

    var disabled = this.disabled();
    if (disabled !== cache.disabled) {
      dom.disabled(this.element(), disabled);
      cache.disabled = disabled;
    }
  };

  SidebarToggleButton.TYPE_COLLAPSE = 'collapse';
  SidebarToggleButton.TYPE_EXPAND = 'expand';

  var ContentHeader = helper.inherits(function(props) {
    ContentHeader.super_.call(this);

    this.element = this.prop(props.element);

    this.sidebarToggleButton = this.prop(new SidebarToggleButton({
      element: this.sidebarToggleButtonElement()
    }));
  }, jCore.Component);

  ContentHeader.prototype.sidebarToggleButtonElement = function() {
    return dom.child(this.element(), 0);
  };

  ContentHeader.prototype.redraw = function() {
    this.sidebarToggleButton().redraw();
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ContentHeader;
  else
    app.ContentHeader = ContentHeader;
})(this.app || (this.app = {}));
