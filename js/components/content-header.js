(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var ContentHeader = helper.inherits(function(props) {
    ContentHeader.super_.call(this);

    this.element = this.prop(props.element);
  }, jCore.Component);

  ContentHeader.prototype.sidebarToggleButtonElement = function() {
    return dom.child(this.element(), 0);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ContentHeader;
  else
    app.ContentHeader = ContentHeader;
})(this.app || (this.app = {}));
