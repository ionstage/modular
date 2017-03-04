(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var Button = helper.inherits(function(props) {
    Button.super_.call(this, props);

    this.isActive = this.prop(false);
    this.disabled = this.prop(false);

    this.registerTapListener();
  }, Component);

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
        if (dom.target(event) === target) {
          this.ontap();
        }
      }.bind(this),
    });
  };

  Button.prototype.redraw = function() {
    this.redrawToggleClass('isActive', 'active');
    this.redrawToggleClass('disabled', 'disabled');
  };

  Button.prototype.ontap = function() {};

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Button;
  } else {
    app.Button = Button;
  }
})(this.app || (this.app = {}));
