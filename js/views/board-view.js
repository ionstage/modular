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
        var ports = piece.ports();
        var propOptionViews = ports.concat().filter(function(port) {
          return !port.isShowing() && port.type() === 'prop';
        }).sort(function(a, b) {
          return (a.contentText() > b.contentText()) ? 1 : -1;
        }).map(function(port) {
          return m('option', {
            value: port.id()
          }, port.contentText())
        });
        var eventOptionViews = ports.concat().filter(function(port) {
          return !port.isShowing() && port.type() === 'event';
        }).sort(function(a, b) {
          return (a.contentText() > b.contentText()) ? 1 : -1;
        }).map(function(port) {
          return m('option', {
            value: port.id()
          }, port.contentText())
        });

        return m('.piece', {
          key: piece.id(),
          className: piece.isLoading() ? 'loading' : '',
          'data-piece-id': piece.id(),
          config: function(element, isInitialized) {
            if (isInitialized)
              return;
            piece.initializeElement(element);
          }
        }, [
          m('.piece-header', [
            m('.piece-header-title', piece.label()),
            m('.piece-header-delete-button', '×')
          ]),
          m('.piece-content', [
            m('iframe.piece-component', {
              src: piece.src() + '#' + piece.id(),
              style: {height: piece.componentHeight()}
            }),
            m('.piece-port-list', {
              className: parseInt(piece.componentHeight()) === 0 ? 'no-component' : ''
            }, ports.map(function(port) {
              if (!port.isShowing())
                return;
              return m('.port.hide-connector-connected', {
                key: port.id(),
                'data-port-id': port.id(),
                config: function(element, isInitialized) {
                  if (isInitialized)
                    return;
                  port.initializeElement(element);
                }
              }, [
                m('.port-connector', [
                  m('.port-connector-in'),
                  m('.port-connector-connected'),
                  m('.port-connector-out')
                ]),
                m('.port-content', [
                  m('.port-content-text', port.contentText()),
                  m('.port-content-delete-button', '×')
                ])
              ]);
            }))
          ]),
          m('.piece-footer', [
            m('select.piece-port-select', {
              className: (propOptionViews.length === 0 && eventOptionViews.length === 0) ? 'hide' : '',
              onchange: function(event) {
                var currentTarget = event.currentTarget;
                boardEvent.showPort(event);
                currentTarget.value = '';
                currentTarget.blur();
              }
            }, [
              m('option', {value: ''}),
              m('optgroup.piece-port-select-optgroup-prop', {label: 'Property'}, propOptionViews),
              m('optgroup.piece-port-select-optgroup-event', {label: 'Event'}, eventOptionViews)
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