(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var ContentHeader = helper.inherits(function(props) {
    ContentHeader.super_.call(this);

    this.sidebarToggleType = this.prop(ContentHeader.SIDEBAR_TOGGLE_TYPE_COLLAPSE);
    this.element = this.prop(props.element);
  }, jCore.Component);

  ContentHeader.prototype.sidebarToggleButtonElement = function() {
    return dom.child(this.element(), 0);
  };

  ContentHeader.SIDEBAR_TOGGLE_TYPE_COLLAPSE = 'collapse';
  ContentHeader.SIDEBAR_TOGGLE_TYPE_EXPAND = 'expand';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ContentHeader;
  else
    app.ContentHeader = ContentHeader;
})(this.app || (this.app = {}));
