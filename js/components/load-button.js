(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');
  var Component = app.Component || require('./component.js');

  var LoadButton = Button.inherits(function(props) {
    this.input = new LoadButton.Input({
      element: this.childElement('.button-input'),
      loader: props.loader,
    });
  });

  LoadButton.prototype.ontap = function() {
    this.input.click();
  };

  LoadButton.Input = (function() {
    var Input = Component.inherits(function(props) {
      this.loader = props.loader;
    });

    Input.prototype.click = function() {
      dom.click(this.element());
    };

    Input.prototype.reset = function() {
      dom.value(this.element(), '');
    };

    Input.prototype.oninit = function() {
      dom.on(this.element(), 'change', Input.prototype.onchange.bind(this));
    };

    Input.prototype.onchange = function(event) {
      var file = dom.file(dom.target(event));
      if (file) {
        this.loader(file);
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
