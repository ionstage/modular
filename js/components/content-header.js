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

  SidebarToggleButton.prototype.registerClickListener = function() {
    dom.on(this.element(), 'click', function() {
      this.disabled(true);
      Promise.resolve().then(function() {
        var type = this.type();
        if (type === SidebarToggleButton.TYPE_COLLAPSE)
          return this.collapser();
        else if (type === SidebarToggleButton.TYPE_EXPAND)
          return this.expander();
      }.bind(this)).then(function() {
        var type = this.type();
        if (type === SidebarToggleButton.TYPE_COLLAPSE)
          this.type(SidebarToggleButton.TYPE_EXPAND);
        else if (type === SidebarToggleButton.TYPE_EXPAND)
          this.type(SidebarToggleButton.TYPE_COLLAPSE);
        this.disabled(false);
      }.bind(this)).catch(function() {
        this.disabled(false);
      }.bind(this));
    }.bind(this));
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

  var ContentHeader = helper.inherits(function(props) {
    ContentHeader.super_.call(this);

    this.element = this.prop(props.element);

    this.sidebarToggleButton = this.prop(new SidebarToggleButton({
      element: this.sidebarToggleButtonElement(),
      collapser: props.sidebarCollapser,
      expander: props.sidebarExpander
    }));

    this.sidebarToggleButton().registerClickListener();
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
