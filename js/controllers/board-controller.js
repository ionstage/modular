(function(app) {
  'use strict';
  var Board = app.Board || require('../components/board.js');

  var BoardController = function() {
    this.board = new Board();
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = BoardController;
  else
    app.BoardController = BoardController;
})(this.app || (this.app = {}));