(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Button = app.Button || require('./button.js');

  var SaveButton = Button.inherits(function(props) {
    this.saver = props.saver;
  });

  SaveButton.prototype.ontap = function() {
    this.saver();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveButton;
  } else {
    app.SaveButton = SaveButton;
  }
})(this.app || (this.app = {}));
