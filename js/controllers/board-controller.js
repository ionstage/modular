(function(app) {
  'use strict';
  var PathContainer = app.PathContainer || require('../components/path-container.js');
  var Board = app.Board || require('../components/board.js');
  var ConnectorHandle = app.ConnectorHandle || require('../components/connector-handle.js');

  var BoardController = function() {
    this.pathContainer = new PathContainer();
    this.board = new Board();
    this.connectorHandle = new ConnectorHandle();
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = BoardController;
  else
    app.BoardController = BoardController;
})(this.app || (this.app = {}));