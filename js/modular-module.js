(function(window) {
  'use strict';

  window.addEventListener('load', function() {
    setTimeout(function() {
      window.postMessage(window.name, location.protocol + '//' + location.host);
    }, 0);
  }, false);
})(this);
