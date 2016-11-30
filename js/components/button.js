(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Button = helper.inherits(function(props) {
    Button.super_.call(this);

    this.isActive = this.prop(false);
    this.element = this.prop(props.element);
    this.cache = this.prop({});
  }, jCore.Component);

  Button.prototype.redraw = function() {
    this.redrawIsActive();
  };

  Button.prototype.redrawIsActive = function() {
    var isActive = this.isActive();
    var cache = this.cache();

    if (isActive === cache.isActive)
      return;

    dom.toggleClass(this.element(), 'active', isActive);
    cache.isActive = isActive;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Button;
  else
    app.Button = Button;
})(this.app || (this.app = {}));
