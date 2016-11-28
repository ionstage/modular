(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var Button = helper.inherits(function(props) {
    Button.super_.call(this);

    this.element = this.prop(props.element);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Button;
  else
    app.Button = Button;
})(this.app || (this.app = {}));
