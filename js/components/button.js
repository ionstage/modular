(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var Button = Component.inherits(function(props) {
    this.isActive = this.prop(false);
    this.disabled = this.prop(false);
    this.draggable = new Button.Draggable({ button: this });
  });

  Button.prototype.oninit = function() {
    this.draggable.enable();
  };

  Button.prototype.onredraw = function() {
    this.redrawBy('isActive', function(isActive) {
      dom.toggleClass(this.element(), 'active', isActive);
    });

    this.redrawBy('disabled', function(disabled) {
      dom.toggleClass(this.element(), 'disabled', disabled);
    });
  };

  Button.Draggable = (function() {
    var Draggable = function(props) {
      this.button = props.button;
      this.draggable = new dom.Draggable({ element: this.button.element() });
    };

    Draggable.prototype.enable = function() {
      this.draggable.enable({
        onstart: this.onstart.bind(this),
        onmove: this.onmove.bind(this),
        onend: this.onend.bind(this),
      });
    };

    Draggable.prototype.onstart = function(x, y, event, context) {
      context.target = dom.target(event);
      dom.cancel(event);
      dom.removeFocus();
      this.button.isActive(true);
    };

    Draggable.prototype.onmove = function(dx, dy, event, context) {
      this.button.isActive(dom.target(event) === context.target);
    };

    Draggable.prototype.onend = function(dx, dy, event, context) {
      this.button.isActive(false);
      if (dom.target(event) === context.target) {
        this.button.emit('tap');
      }
    };

    return Draggable;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Button;
  } else {
    app.Button = Button;
  }
})(this.app || (this.app = {}));
