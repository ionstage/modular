(function(app) {
  'use strict';
  var m = require('mithril');
  var boardView = app.boardView || require('../views/board-view.js');

  var mainPanelView = function(ctrl) {
    return m('#main_panel', {
      config: function(element, isInitialized) {
        if (isInitialized)
          return;

        ctrl.dispatchEvent({
          type: 'init',
          element: element
        });

        var pieceTemplateElement = dom.el('#piece_template');
        var portTemplateElement = dom.el('#port_template');
        var boardElement = dom.el('#board');

        // template
        piece.template(pieceTemplateElement);
        port.template(portTemplateElement);

        // board
        board.element({
          mainPanel: element,
          board: boardElement
        });

        // board event
        boardEvent.element({
          mainPanel: element,
          board: boardElement
        });
        boardEvent.loadURLHash();
      }
    }, boardView());
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = mainPanelView;
  else
    app.mainPanelView = mainPanelView;
})(this.app || (this.app = {}));