(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var ContentHeader = helper.inherits(function(props) {
    ContentHeader.super_.call(this);

    this.element = this.prop(props.element);
  }, jCore.Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ContentHeader;
  else
    app.ContentHeader = ContentHeader;
})(this.app || (this.app = {}));
