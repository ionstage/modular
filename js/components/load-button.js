(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');

  var LoadButton = helper.inherits(function(props) {
    LoadButton.super_.call(this, props);

    this.loader = props.loader;

    this.registerChangeListener();
  }, Button);

  LoadButton.prototype.inputElement = function() {
    return dom.child(this.element(), 2);
  };

  LoadButton.prototype.registerChangeListener = function() {
    dom.on(this.inputElement(), 'change', function(event) {
      var file = event.target.files[0];

      if (!file) {
        return;
      }

      this.loader(file);

      // reset file input
      dom.value(this.inputElement(), '');
    }.bind(this));
  };

  LoadButton.prototype.ontap = function() {
    this.inputElement().click();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadButton;
  } else {
    app.LoadButton = LoadButton;
  }
})(this.app || (this.app = {}));
