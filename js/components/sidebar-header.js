(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var SidebarHeader = jCore.Component.inherits(function() {
    this.searchInput = new SidebarHeader.SearchInput(dom.find(this.el, '.search-input'));
  });

  SidebarHeader.prototype.loadSearchText = function() {
    // apply initial value of input
    this.searchInput.oninput();
  };

  SidebarHeader.prototype.oninit = function() {
    this.searchInput.on('input', this.emit.bind(this, 'search'));
  };

  SidebarHeader.SearchInput = (function() {
    var SearchInput = jCore.Component.inherits(function() {
      this.isFocused = this.prop(false);
    });

    SearchInput.prototype.oninit = function() {
      this.isFocused(dom.isFocused(this.el));
      dom.on(this.el, dom.eventType('start'), this.onpoint.bind(this));
      dom.on(this.el, 'click', this.onclick.bind(this));
      dom.on(this.el, 'input', this.oninput.bind(this));
      dom.on(this.el, 'focus', this.onfocus.bind(this));
    };

    SearchInput.prototype.onpoint = function() {
      this.isFocused(dom.isFocused(this.el));
    };

    SearchInput.prototype.onclick = function() {
      if (!this.isFocused() && !dom.hasSelection(this.el)) {
        dom.selectAll(this.el);
      }
    };

    SearchInput.prototype.oninput = function() {
      this.emit('input', dom.value(this.el));
    };

    SearchInput.prototype.onfocus = function() {
      if (dom.hasSelection(this.el)) {
        dom.clearSelection(this.el);
      }
    };

    return SearchInput;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarHeader;
  } else {
    app.SidebarHeader = SidebarHeader;
  }
})(this.app || (this.app = {}));
