(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var SidebarHeader = helper.inherits(function(props) {
    SidebarHeader.super_.call(this, props);

    this.disabled = this.prop(true);

    this.registerSearchInputFocusListener();
    this.registerSearchInputInputListener();
  }, Component);

  SidebarHeader.prototype.searchInputElement = function() {
    return dom.child(this.element(), 0);
  };

  SidebarHeader.prototype.searchText = function() {
    return dom.value(this.searchInputElement());
  };

  SidebarHeader.prototype.registerSearchInputFocusListener = function() {
    var searchInputElement = this.searchInputElement();
    var isFocused = dom.isFocused(searchInputElement);

    dom.on(searchInputElement, dom.eventType('start'), function() {
      isFocused = dom.isFocused(searchInputElement);
    });

    dom.on(searchInputElement, 'click', function() {
      if (!isFocused && !dom.hasSelection(searchInputElement)) {
        dom.selectAll(searchInputElement);
      }
    });
  };

  SidebarHeader.prototype.registerSearchInputInputListener = function() {
    dom.on(this.searchInputElement(), 'input', function() {
      this.markDirty();
    }.bind(this));
  };

  SidebarHeader.prototype.redraw = function() {
    this.redrawDisabled();
  };

  SidebarHeader.prototype.redrawDisabled = function() {
    this.redrawProp('disabled', function(disabled) {
      dom.disabled(this.searchInputElement(), disabled);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarHeader;
  } else {
    app.SidebarHeader = SidebarHeader;
  }
})(this.app || (this.app = {}));
