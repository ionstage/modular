(function(window) {
  'use strict';

  window.modular = {
    Module: window.parent.app.ModularModule
  };

  window.addEventListener('load', function() {
    window.postMessage(window.name, location.protocol + '//' + location.host);
  });
})(this);
