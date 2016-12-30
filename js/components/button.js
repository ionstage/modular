(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Button = helper.inherits(function(props) {
    Button.super_.call(this);

    this.isActive = this.prop(false);
    this.disabled = this.prop(false);
    this.element = this.prop(props.element);
    this.cache = this.prop({});
  }, jCore.Component);

  Button.prototype.registerTapListener = function() {
    var target;
    new dom.Draggable({
      element: this.element(),
      onstart: function(x, y, event) {
        target = dom.target(event);
        dom.cancel(event);
        dom.removeFocus();
        this.isActive(true);
      }.bind(this),
      onmove: function(dx, dy, event) {
        this.isActive(dom.target(event) === target);
      }.bind(this),
      onend: function(dx, dy, event) {
        this.isActive(false);
        if (dom.target(event) === target)
          this.ontap();
      }.bind(this),
    });
  };

  Button.prototype.redraw = function() {
    this.redrawState('isActive', 'active');
    this.redrawState('disabled', 'disabled');
  };

  Button.prototype.redrawState = function(key, className) {
    var cache = this.cache();
    var value = this[key]();
    if (value !== cache[key]) {
      dom.toggleClass(this.element(), className, value);
      cache[key] = value;
    }
  };

  Button.prototype.ontap = function() {};

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Button;
  else
    app.Button = Button;
})(this.app || (this.app = {}));
