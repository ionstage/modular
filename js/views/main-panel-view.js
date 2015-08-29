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
    }, [
      boardView(ctrl.boardController),
      m('.retainer', {
        config: function(element, isInitialized) {
          if (!isInitialized)
            return;

          var mainPanelElement = ctrl.element();

          var scrollLeft = mainPanelElement.scrollLeft;
          var scrollTop = mainPanelElement.scrollTop;

          dom.addClass(element, 'hide');

          var clientWidth = mainPanelElement.clientWidth;
          var clientHeight = mainPanelElement.clientHeight;
          var scrollWidth = mainPanelElement.scrollWidth;
          var scrollHeight = mainPanelElement.scrollHeight;
          if (scrollWidth > clientWidth || scrollHeight > clientHeight) {
            var x = scrollWidth + (scrollWidth > clientWidth ? 46 : -1);
            var y = scrollHeight + (scrollHeight > clientHeight ? 46 : -1);
            dom.translate(element, x, y);
            dom.removeClass(element, 'hide');
            mainPanelElement.scrollLeft = scrollLeft;
            mainPanelElement.scrollTop = scrollTop;
          }
        }
      })
    ]);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = mainPanelView;
  else
    app.mainPanelView = mainPanelView;
})(this.app || (this.app = {}));