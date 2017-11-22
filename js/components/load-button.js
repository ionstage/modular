(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');
  var Component = app.Component || require('./component.js');

  var LoadButton = Component.inherits(function(props) {
    this.button = new Button({ element: props.element });
    this.input = new LoadButton.Input({ element: this.childElement('.button-input') });
  });

  LoadButton.prototype.oninit = function() {
    this.button.on('tap', this.ontap.bind(this));
    this.input.on('load', this.onload.bind(this));
  };

  LoadButton.prototype.ontap = function() {
    this.input.click();
  };

  LoadButton.prototype.onload = function(file) {
    this.emit('load', file);
  };

  LoadButton.Input = (function() {
    var Input = Component.inherits();

    Input.prototype.click = function() {
      dom.click(this.element());
    };

    Input.prototype.reset = function() {
      dom.value(this.element(), '');
    };

    Input.prototype.oninit = function() {
      dom.on(this.element(), 'change', this.onchange.bind(this));
    };

    Input.prototype.onchange = function(event) {
      var file = dom.file(dom.target(event));
      if (file) {
        this.emit('load', file);
        this.reset();
      }
    };

    return Input;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadButton;
  } else {
    app.LoadButton = LoadButton;
  }
})(this.app || (this.app = {}));
