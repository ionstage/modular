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
    return dom.child(this.element(), 0);
  };

  LoadButton.prototype.registerChangeListener = function() {
    dom.on(this.inputElement(), 'change', function(event) {
      this.loader(event.target.files[0]);

      // reset file input
      dom.value(this.inputElement(), '');
    }.bind(this));
  };

  LoadButton.prototype.ontap = function() {
    if (dom.supportsTouch()) {
      this.inputElement().click();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadButton;
  } else {
    app.LoadButton = LoadButton;
  }
})(this.app || (this.app = {}));