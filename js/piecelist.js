(function(window) {
  'use strict';
  var pieceList = (function() {
    function set(data) {
      window.name = JSON.stringify(data);
      location.replace('blank.html');
    }
    return {
      set: set
    };
  }());
  window.pieceList = pieceList;
}(this));