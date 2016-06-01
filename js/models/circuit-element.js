(function(app) {
  'use strict';

  var CircuitElement = function() {};

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CircuitElement;
  else
    app.CircuitElement = CircuitElement;
})(this.app || (this.app = {}));
