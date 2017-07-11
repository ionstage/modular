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
    dom.on(this.inputElement(), 'change', function(event) {
      var file = dom.file(dom.target(event));
      if (file) {
        this.loader(file);
      }
    }.bind(this));
  };

  LoadButton.prototype.ontap = function() {
    dom.click(this.inputElement());
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadButton;
  } else {
    app.LoadButton = LoadButton;
  }
})(this.app || (this.app = {}));
