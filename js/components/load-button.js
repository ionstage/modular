(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');

  var LoadButton = Button.inherits(function(props) {
    this.loader = props.loader;

    this.registerChangeListener();
  });

  LoadButton.prototype.inputElement = function() {
    return dom.child(this.element(), 2);
  };

  LoadButton.prototype.registerChangeListener = function() {
    dom.on(this.inputElement(), 'change', LoadButton.prototype.onchange.bind(this));
  };

  LoadButton.prototype.resetInput = function() {
    dom.value(this.inputElement(), '');
  };

  LoadButton.prototype.ontap = function() {
    dom.click(this.inputElement());
  };

  LoadButton.prototype.onchange = function(event) {
    var file = dom.file(dom.target(event));
    if (file) {
      this.loader(file);
      this.resetInput();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadButton;
  } else {
    app.LoadButton = LoadButton;
  }
})(this.app || (this.app = {}));
