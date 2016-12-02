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
      }.bind(this)
    });
  };

  Button.prototype.redraw = function() {
    this.redrawIsActive();
    this.redrawDisabled();
  };

  Button.prototype.redrawIsActive = function() {
    var isActive = this.isActive();
    var cache = this.cache();

    if (isActive === cache.isActive)
      return;

    dom.toggleClass(this.element(), 'active', isActive);
    cache.isActive = isActive;
  };

  Button.prototype.redrawDisabled = function() {
    var disabled = this.disabled();
    var cache = this.cache();

    if (disabled === cache.disabled)
      return;

    dom.disabled(this.element(), disabled);
    cache.disabled = disabled;
  };

  Button.prototype.ontap = function() {};

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Button;
  else
    app.Button = Button;
})(this.app || (this.app = {}));
