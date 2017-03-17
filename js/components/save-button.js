(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Button = app.Button || require('./button.js');

  var SaveButton = helper.inherits(function(props) {
    SaveButton.super_.call(this, props);

    this.saver = props.saver;
  }, Button);

  SaveButton.prototype.ontap = function() {
    this.saver();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveButton;
  } else {
    app.SaveButton = SaveButton;
  }
})(this.app || (this.app = {}));
