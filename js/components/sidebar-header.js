(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var SidebarHeader = Component.inherits(function(props) {
    this.searchInput = new SidebarHeader.SearchInput({
      element: this.childElement('.search-input'),
      inputter: props.searcher,
    });
  });

  SidebarHeader.prototype.loadSearchText = function() {
    // apply initial value of input
    this.searchInput.oninput();
  };

  SidebarHeader.SearchInput = (function() {
    var SearchInput = Component.inherits(function(props) {
      this.isFocused = this.prop(false);
      this.inputter = props.inputter;
    });

    SearchInput.prototype.oninit = function() {
      this.isFocused(dom.isFocused(this.element()));
      dom.on(this.element(), dom.eventType('start'), SearchInput.prototype.onstart.bind(this));
      dom.on(this.element(), 'click', SearchInput.prototype.onclick.bind(this));
      dom.on(this.element(), 'input', SearchInput.prototype.oninput.bind(this));
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
      this.inputter(dom.value(this.element()));
    };

    return SearchInput;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarHeader;
  } else {
    app.SidebarHeader = SidebarHeader;
  }
})(this.app || (this.app = {}));
