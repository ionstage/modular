(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var SidebarHeader = Component.inherits(function(props) {
    this.searcher = props.searcher;

    this.registerSearchInputFocusListener();
    this.registerSearchInputInputListener();
  });

  SidebarHeader.prototype.searchInputElement = function() {
    return this.childElement('.search-input');
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
      this.searcher(this.searchText());
    }.bind(this));
  };

  SidebarHeader.prototype.loadSearchText = function() {
    this.searcher(this.searchText());
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarHeader;
  } else {
    app.SidebarHeader = SidebarHeader;
  }
})(this.app || (this.app = {}));
