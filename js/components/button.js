(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var Button = Component.inherits(function(props) {
    this.isActive = this.prop(false);
    this.disabled = this.prop(false);
    this.tapper = props.tapper;
  });

  Button.prototype.redraw = function() {
    this.redrawBy('isActive', function(isActive) {
      dom.toggleClass(this.element(), 'active', isActive);
    });

    this.redrawBy('disabled', function(disabled) {
      dom.toggleClass(this.element(), 'disabled', disabled);
    });
  };

  Button.prototype.oninit = function() {
    new dom.Draggable({
      element: this.element(),
      onstart: Button.prototype.onstart.bind(this),
      onmove: Button.prototype.onmove.bind(this),
      onend: Button.prototype.onend.bind(this),
    });
  };

  Button.prototype.onstart = function(x, y, event, context) {
    context.target = dom.target(event);
    dom.cancel(event);
    dom.removeFocus();
    this.isActive(true);
  };

  Button.prototype.onmove = function(dx, dy, event, context) {
    this.isActive(dom.target(event) === context.target);
  };

  Button.prototype.onend = function(dx, dy, event, context) {
    this.isActive(false);
    if (dom.target(event) === context.target) {
      this.tapper();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Button;
  } else {
    app.Button = Button;
  }
})(this.app || (this.app = {}));
