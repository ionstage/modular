(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var Button = helper.inherits(function() {
    Button.super_.call(this);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Button;
  else
    app.Button = Button;
})(this.app || (this.app = {}));
