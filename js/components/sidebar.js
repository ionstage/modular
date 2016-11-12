(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var Sidebar = helper.inherits(function() {
    Sidebar.super_.call(this);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Sidebar;
  else
    app.Sidebar = Sidebar;
})(this.app || (this.app = {}));
