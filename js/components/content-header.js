(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var SidebarToggleButton = app.SidebarToggleButton || require('./sidebar-toggle-button.js');

  var ContentHeader = helper.inherits(function(props) {
    ContentHeader.super_.call(this);

    this.element = this.prop(props.element);

    this.sidebarToggleButton = this.prop(new SidebarToggleButton({
      element: this.sidebarToggleButtonElement(),
      collapser: props.sidebarCollapser,
      expander: props.sidebarExpander
    }));

    this.sidebarToggleButton().registerTapListener();
  }, jCore.Component);

  ContentHeader.prototype.sidebarToggleButtonElement = function() {
    return dom.child(this.element(), 0);
  };

  ContentHeader.prototype.loadButtonElement = function() {
    return dom.child(this.element(), 1);
  };

  ContentHeader.prototype.saveButtonElement = function() {
    return dom.child(this.element(), 2);
  };

  ContentHeader.prototype.redraw = function() {
    this.sidebarToggleButton().redraw();
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ContentHeader;
  else
    app.ContentHeader = ContentHeader;
})(this.app || (this.app = {}));
