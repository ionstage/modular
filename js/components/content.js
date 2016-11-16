(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var Content = helper.inherits(function(props) {
    Content.super_.call(this);

    this.element = this.prop(props.element);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Content;
  else
    app.Content = Content;
})(this.app || (this.app = {}));
