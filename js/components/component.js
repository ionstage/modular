(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var Component = helper.inherits(function() {
    Component.super_.call(this);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Component;
  } else {
    app.Component = Component;
  }
})(this.app || (this.app = {}));
