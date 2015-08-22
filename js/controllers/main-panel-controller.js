(function(app) {
  'use strict';
  var m = require('mithril');
  var BoardController = app.BoardController || require('../controller/board-controller.js');

  var MainPanelController = function() {
    this.element = m.prop(null);
    this.boardController = new BoardController();
  };

  MainPanelController.prototype.addPiece = function(pageX, pageY, label, src) {
    var element = this.element();

    if (!element)
      return;

    var x = pageX - element.offsetLeft + element.scrollLeft;
    var y = pageY + element.scrollTop;

    if (x < 0 || y < 0)
      return;

    boardEvent.addPiece(x, y, label, src);
  };

  MainPanelController.prototype.dispatchEvent = function(event) {
    switch (event.type) {
    case 'init':
      this.element(event.element);
      break;
    default:
      break;
    }
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = MainPanelController;
  else
    app.MainPanelController = MainPanelController;
})(this.app || (this.app = {}));