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

        // board event
        boardEvent.element({
          mainPanel: element,
          board: dom.el('#board')
        });
        boardEvent.loadURLHash();
      }
    }, boardView(ctrl.boardController));
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = mainPanelView;
  else
    app.mainPanelView = mainPanelView;
})(this.app || (this.app = {}));