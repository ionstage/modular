(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var Binding = function(props) {
    this.sourceUnit = props.sourceUnit;
    this.targetUnit = props.targetUnit;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Binding;
  } else {
    app.Binding = Binding;
  }
})(this.app || (this.app = {}));
