(function(app) {
  'use strict';

  var helper = {};

  helper.identity = function(value) {
    return value;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = helper;
  else
    app.helper = helper;
})(this.app || (this.app = {}));