(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var ContentHeader = helper.inherits(function(props) {
    ContentHeader.super_.call(this);

    this.sidebarToggleType = this.prop(ContentHeader.SIDEBAR_TOGGLE_TYPE_COLLAPSE);
    this.sidebarToggleDisabled = this.prop(false);
    this.element = this.prop(props.element);
    this.cache = this.prop({});
  }, jCore.Component);

  ContentHeader.prototype.sidebarToggleButtonElement = function() {
    return dom.child(this.element(), 0);
  };

  ContentHeader.prototype.redraw = function() {
    var cache = this.cache();

    var sidebarToggleType = this.sidebarToggleType();
    if (sidebarToggleType !== cache.sidebarToggleType) {
      dom.data(this.sidebarToggleButtonElement(), 'type', sidebarToggleType);
      cache.sidebarToggleType = sidebarToggleType;
    }

    var sidebarToggleDisabled = this.sidebarToggleDisabled();
    if (sidebarToggleDisabled !== cache.sidebarToggleDisabled) {
      dom.disabled(this.sidebarToggleButtonElement(), sidebarToggleDisabled);
      cache.sidebarToggleDisabled = sidebarToggleDisabled;
    }
  };

  ContentHeader.SIDEBAR_TOGGLE_TYPE_COLLAPSE = 'collapse';
  ContentHeader.SIDEBAR_TOGGLE_TYPE_EXPAND = 'expand';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ContentHeader;
  else
    app.ContentHeader = ContentHeader;
})(this.app || (this.app = {}));
