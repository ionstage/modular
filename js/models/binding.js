(function(app) {
  'use strict';

  var Binding = function(props) {
    this.sourcePort = props.sourcePort;
    this.targetPort = props.targetPort;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Binding;
  } else {
    app.Binding = Binding;
  }
})(this.app || (this.app = {}));
