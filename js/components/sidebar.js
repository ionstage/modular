(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Sidebar = helper.inherits(function(props) {
    Sidebar.super_.call(this);

    this.element = this.prop(props.element);
  }, jCore.Component);

  Sidebar.prototype.searchInputElement = function() {
    return dom.child(this.element(), 0, 0);
  };

  Sidebar.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
  } else {
    app.Sidebar = Sidebar;
  }
})(this.app || (this.app = {}));
