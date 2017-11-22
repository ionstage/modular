(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var SidebarHeader = Component.inherits(function() {
    this.searchInput = new SidebarHeader.SearchInput({ element: this.childElement('.search-input') });
  });

  SidebarHeader.prototype.loadSearchText = function() {
    // apply initial value of input
    this.searchInput.oninput();
  };

  SidebarHeader.prototype.oninit = function() {
    this.searchInput.on('input', this.onsearch.bind(this));
  };

  SidebarHeader.prototype.onsearch = function(text) {
    this.emit('search', text);
  };

  SidebarHeader.SearchInput = (function() {
    var SearchInput = Component.inherits(function() {
      this.isFocused = this.prop(false);
    });

    SearchInput.prototype.oninit = function() {
      this.isFocused(dom.isFocused(this.element()));
      dom.on(this.element(), dom.eventType('start'), this.onstart.bind(this));
      dom.on(this.element(), 'click', this.onclick.bind(this));
      dom.on(this.element(), 'input', this.oninput.bind(this));
    };

    SearchInput.prototype.onstart = function() {
      this.isFocused(dom.isFocused(this.element()));
    };

    SearchInput.prototype.onclick = function() {
      if (!this.isFocused() && !dom.hasSelection(this.element())) {
        dom.selectAll(this.element());
      }
    };

    SearchInput.prototype.oninput = function() {
      this.emit('input', dom.value(this.element()));
    };

    return SearchInput;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarHeader;
  } else {
    app.SidebarHeader = SidebarHeader;
  }
})(this.app || (this.app = {}));
