(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Content = helper.inherits(function(props) {
    Content.super_.call(this);

    this.element = this.prop(props.element);
  }, jCore.Component);

  Content.prototype.contentHeaderElement = function() {
    return dom.child(this.element(), 0);
  };

  Content.prototype.moduleContainerElement = function() {
    return dom.child(this.element(), 1);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Content;
  else
    app.Content = Content;
})(this.app || (this.app = {}));
