(function(app) {
  'use strict';
  var m = require('mithril');
  var ConnectorHandle = app.ConnectorHandle || require('../components/connector-handle.js');

  var mainPanelView = function(ctrl) {
    return m('#main_panel', {
      config: function(element, isInitialized) {
        if (isInitialized)
          return;
        var pieceTemplateElement = dom.el('#piece_template');
        var portTemplateElement = dom.el('#port_template');
        var pathContainerElement = dom.el('#path_container');
        var boardElement = dom.el('#board');

        // template
        piece.template(pieceTemplateElement);
        port.template(portTemplateElement);

        // path container
        pathContainer.element(pathContainerElement);

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
    }, [
      m('svg#path_container'),
      m('#board'),
      m('.port-connector-out.drag.hide', {
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          boardEvent.setConnectorHandle(new ConnectorHandle(element));
        }
      })
    ]);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = mainPanelView;
  else
    app.mainPanelView = mainPanelView;
})(this.app || (this.app = {}));