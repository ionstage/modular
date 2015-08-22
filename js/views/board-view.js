(function(app) {
  'use strict';
  var m = require('mithril');
  var ConnectorHandle = app.ConnectorHandle || require('../components/connector-handle.js');
  var Board = app.Board || require('../components/board.js');
  var PathContainer = app.PathContainer || require('../components/path-container.js');

  var boardView = function(ctrl) {
    return [
      m('svg#path_container', {
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          boardEvent.setPathContainer(new PathContainer(element));
        }
      }),
      m('#board', {
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          ctrl.board.element(element);
          boardEvent.setBoard(ctrl.board);
        }
      }, ctrl.board.pieces().map(function(piece) {
        return m('.piece.loading', {
          key: piece.id(),
          'data-piece-id': piece.id(),
          config: function(element, isInitialized) {
            if (isInitialized)
              return;
            piece.initializeElement(element);
          }
        }, [
          m('.piece-header', [
            m('.piece-header-title.loading', piece.label()),
            m('.piece-header-delete-button', '×')
          ]),
          m('.piece-content.loading', [
            m('.piece-component-back.hide'),
            m('iframe.piece-component', {src: piece.src() + '#' + piece.id()}),
            m('.piece-port-list.hide')
          ]),
          m('.piece-footer.loading', [
            m('select.piece-port-select.hide', [
              m('option', {value: ''}),
              m('optgroup.piece-port-select-optgroup-prop', {label: 'Property'}),
              m('optgroup.piece-port-select-optgroup-event', {label: 'Event'})
            ])
          ])
        ]);
      })),
      m('.port-connector-out.drag.hide', {
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          boardEvent.setConnectorHandle(new ConnectorHandle(element));
        }
      })
    ];
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = boardView;
  else
    app.boardView = boardView;
})(this.app || (this.app = {}));