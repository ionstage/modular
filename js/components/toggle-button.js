(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');
  var Component = app.Component || require('./component.js');

  var ToggleButton = Component.inherits(function(props) {
    this.type = this.prop(props.type);
    this.button = new Button({ element: props.element });
  });

  ToggleButton.prototype.disabled = function(value) {
    return this.button.disabled(value);
  };

  ToggleButton.prototype.oninit = function() {
    this.button.on('tap', this.ontap.bind(this));
  };

  ToggleButton.prototype.onredraw = function() {
    this.redrawBy('type', function(type) {
      dom.data(this.element(), 'type', type);
    });
  };

  ToggleButton.prototype.ontap = function() {
    this.emit('tap');
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToggleButton;
  } else {
    app.ToggleButton = ToggleButton;
  }
})(this.app || (this.app = {}));
