(function(app) {
  'use strict';
  var m = require('mithril');

  var PathContainer = function() {
    this._dirtyIDs = [];
    this._positionMap = {};
    this._connections = [];
  };

  PathContainer.prototype.append = function(sourceID, targetID) {
    var path = getPath(this, sourceID, targetID);

    if (path)
      return;

    this._connections.push({
      sourceID: sourceID,
      targetID: targetID
    });
  };

  PathContainer.prototype.remove = function(sourceID, targetID) {
    var path = getPath(this, sourceID, targetID);

    if (!path)
      return;

    var connections = this._connections;
    for (var i = connections.length - 1; i >= 0; i--) {
      var connection = connections[i];
      if (connection.sourceID === sourceID && connection.targetID === targetID)
        connections.splice(i, 1);
    }
  };

  PathContainer.prototype.change = function(oldIDSet, newIDSet) {
    var oldSourceID = oldIDSet[0];
    var oldTargetID = oldIDSet[1];
    var newSourceID = newIDSet[0];
    var newTargetID = newIDSet[1];

    if (oldSourceID === newSourceID && oldTargetID === newTargetID)
      return;

    var path = getPath(this, oldSourceID, oldTargetID);

    if (!path)
      return;

    var newPath = getPath(this, newSourceID, newTargetID);

    if (newPath)
      this.remove(newSourceID, newTargetID);

    path.sourceID = newSourceID;
    path.targetID = newTargetID;

    var pathElement = path.element;
    pathElement.setAttribute('data-source-id', newSourceID);
    pathElement.setAttribute('data-target-id', newTargetID);
  };

  PathContainer.prototype.position = function(id, point) {
    if (typeof point === 'undefined')
      return this._positionMap[id] || {x: 0, y: 0};

    this._dirtyIDs.push(id);
    this._positionMap[id] = point;
  };

  PathContainer.prototype.updatePosition = function() {
    var dirtyIDs = this._dirtyIDs;
    var positionMap = this._positionMap;

    dirtyIDs.forEach(function(id) {
      var paths = getAllPaths(this, id, id);
      paths.forEach(function(path) {
        var sourcePoint = positionMap[path.sourceID];
        var targetPoint = positionMap[path.targetID];
        if (path.element) {
          path.element.setAttribute('d', 'M' + sourcePoint.x + ',' + sourcePoint.y +
                                    'L' + targetPoint.x + ',' + targetPoint.y + 'Z');
        }
      });
    }.bind(this));

    this._dirtyIDs = [];
  };

  PathContainer.prototype.refreshPosition = function() {
    var positionMap = this._positionMap;

    for (var id in positionMap) {
      var paths = getAllPaths(this, id, id);
      if (paths.length === 0)
        delete positionMap[id];
    }
  };

  PathContainer.prototype.getSourceID = function(targetID) {
    var path = getPath(this, null, targetID);

    if (path)
      return path.sourceID;
    else
      return null;
  };

  PathContainer.prototype.getTargetIDs = function(sourceID) {
    var paths = getAllPaths(this, sourceID);

    return paths.map(function(path) {
      return path.targetID;
    });
  };

  PathContainer.prototype.setFlushPath = function(sourceID, targetID, flag) {
    var path = getPath(this, sourceID, targetID);

    if (!path)
      return;

    var pathElement = path.element;

    if (flag)
      pathElement.setAttribute('class', 'flush');
    else
      pathElement.removeAttribute('class');
  };

  PathContainer.prototype.getConnectionList = function() {
    return this._connections.map(function(path) {
      return {
        sourceID: path.sourceID,
        targetID: path.targetID
      };
    });
  };

  PathContainer.prototype.setPathElement = function(element, sourceID, targetID) {
    var path = getPath(this, sourceID, targetID);
    path.element = element;
  };

  var getPath = function(self, sourceID, targetID) {
    var connections = self._connections;

    for (var i = connections.length - 1; i >= 0; i--) {
      var connection = connections[i];
      if ((!sourceID || connection.sourceID === sourceID) && connection.targetID === targetID)
        return connection;
    }

    return null;
  };

  var getAllPaths = function(self, sourceID, targetID) {
    return self._connections.filter(function(connection) {
      return connection.sourceID === sourceID || connection.targetID === targetID;
    });
  };

  var Board = function(element) {
    this._element = element;
    this._pieceMap = {};
    this._connectorSizeOffset = 21;
    this._dirtyPortConnectorConnectedMap = {};
  };

  Board.prototype.element = function(element) {
    this._element = element;
  };

  Board.prototype.append = function(piece) {
    var pieceID = generateID();
    piece.id(pieceID);
    this._pieceMap[pieceID] = piece;
    m.redraw();
  };

  Board.prototype.remove = function(piece) {
    piece.destroy();
    var pieceID = piece.id();
    delete this._pieceMap[pieceID];
    m.redraw();
  };

  Board.prototype.pieceMap = function() {
    return this._pieceMap;
  };

  Board.prototype.pieces = function() {
    var pieceMap = this._pieceMap;
    return Object.keys(pieceMap).map(function(key) {
      return pieceMap[key];
    });
  };

  Board.prototype.startDrag = function() {
    dom.addClass(this._element, 'drag');
  };

  Board.prototype.endDrag = function() {
    dom.removeClass(this._element, 'drag');
  };

  Board.prototype.getInConnectorNotConnectedElements = function(type) {
    var nodes = this._element.querySelectorAll('.port-connector-in');
    var notConnectedElements = [];
    for (var i = 0, len = nodes.length; i < len; i++) {
      var node = nodes[i];
      var portElement = node.parentNode.parentNode;
      if (dom.hasClass(portElement, type) &&
          !dom.hasClass(portElement, 'hide-connector-in') &&
          dom.hasClass(portElement, 'hide-connector-connected')) {
        notConnectedElements.push(node);
      }
    }
    return notConnectedElements;
  };

  Board.prototype.getPort = function(portID) {
    var idSet = portID.split('/');
    var pieceID = idSet[0];
    var piece = this._pieceMap[pieceID];
    var portMap = piece.portMap();
    return portMap[idSet[1] + '/' + idSet[2]];
  };

  Board.prototype.showPortConnectorConnected = function(portID) {
    this._dirtyPortConnectorConnectedMap[portID] = true;
  };

  Board.prototype.hidePortConnectorConnected = function(portID) {
    this._dirtyPortConnectorConnectedMap[portID] = false;
  };

  Board.prototype.updatePortConnectorConnected = function() {
    var map = this._dirtyPortConnectorConnectedMap;
    var list = Object.keys(map).map(function(portID) {
      var port = this.getPort(portID);
      if (map[portID])
        port.showConnectorConnected();
      else
        port.hideConnectorConnected();
    }.bind(this));
    if (list.length !== 0)
      this._dirtyPortConnectorConnectedMap = {};
  };


  Board.prototype.getOutConnectorElement = function(portID) {
    var port = this.getPort(portID);
    return port.getOutConnectorElement();
  };

  Board.prototype.getConnectorOffset = function(element) {
    var offsetX = 0, offsetY = 0, count = 0;
    if (element) {
      var elementStyle = getComputedStyle(element, null);
      var rect = element.getBoundingClientRect();
      var parent = this._element.parentNode;
      var parentRect = parent.getBoundingClientRect();
      offsetX = rect.left + parent.scrollLeft - parentRect.left -
                parseInt(elementStyle.marginLeft || 0) +
                parseInt(isFF() ? 0 : (elementStyle.borderLeftWidth || 0));
      offsetY = rect.top + parent.scrollTop - parentRect.top -
                parseInt(elementStyle.marginTop || 0) +
                parseInt(isFF() ? 0 : (elementStyle.borderTopWidth || 0));
    }
    return {x: offsetX, y: offsetY};
  };

  Board.prototype.getConnectorPosition = function(connectorID, isSortingPort) {
    var idList = connectorID.split('/');
    var pieceID = idList[0];
    var portName = idList[1] + '/' + idList[2];
    var connectorType = idList[3];

    var piece = this._pieceMap[pieceID];
    var portMap = piece.portMap();
    var port = portMap[portName];
    var connectorOffset;
    var connectorSizeOffset = this._connectorSizeOffset;

    if (connectorType === 'out') {
      if (isSortingPort)
        connectorOffset = this.getConnectorOffset(port.getOutConnectorElement());
      else
        connectorOffset = piece.getOutConnectorOffset(port);
      return {
        x: connectorOffset.x + connectorSizeOffset,
        y: connectorOffset.y + connectorSizeOffset
      };
    } else if (connectorType === 'in') {
      if (isSortingPort) {
        connectorOffset = this.getConnectorOffset(port.getInConnectorElement());
        connectorOffset.x -= (isFF() ? 0 : 4);
        connectorOffset.y -= (isFF() ? 0 : 4);
      } else {
        connectorOffset = piece.getInConnectorOffset(port);
      }
      return {
        x: connectorOffset.x + connectorSizeOffset,
        y: connectorOffset.y + connectorSizeOffset
      };
    } else {
      return null;
    }
  };

  Board.prototype.getConnectorSizeOffset = function() {
    return this._connectorSizeOffset;
  };

  Board.prototype.isLoading = function() {
    return this._element.querySelectorAll('.piece.loading').length !== 0;
  };

  var generateID = (function() {
    var base = Math.floor(Math.random() * Math.pow(10, 16));
    var count = 0;
    return function() {
      var hash = CryptoJS.SHA1(('0' + base + count).slice(-16) +
                               Math.random().toString().substring(1));
      count += 1;
      return hash.toString();
    };
  })();

  var isFF = function() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
  };

  var ConnectorHandle = function() {
    this.type = m.prop('');
    this.x = propWithCache(0);
    this.y = propWithCache(0);
    this.visible = propWithCache(false);
    this.element = m.prop(null);
  };

  ConnectorHandle.prototype.redraw = function() {
    var element = this.element();

    if (this.x.dirty || this.y.dirty) {
      dom.translate(element, this.x(), this.y());
      this.x.dirty = false;
      this.y.dirty = false;
    }

    if (this.visible.dirty) {
      if (this.visible())
        dom.removeClass(element, 'hide');
      else
        dom.addClass(element, 'hide');
      this.visible.dirty = false;
    }
  };

  var propWithCache = function(initialValue) {
    var cache = initialValue;
    var propFunc = function(value) {
      if (typeof value === 'undefined')
        return cache;
      if (cache === value)
        return;
      cache = value;
      propFunc.dirty = true;
    };
    propFunc.dirty = false;
    return propFunc;
  };

  var BoardController = function() {
    this.pathContainer = new PathContainer();
    this.board = new Board();
    this.connectorHandle = new ConnectorHandle();
  };

  var boardView = function(ctrl) {
    var pathContainer = ctrl.pathContainer;
    var connectorHandle = ctrl.connectorHandle;

    return m('div', [
      m('svg#path_container', {
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          boardEvent.setPathContainer(pathContainer);
        }
      }, pathContainer.getConnectionList().map(function(path) {
        var sourceID = path.sourceID;
        var targetID = path.targetID;
        var sourcePoint = pathContainer.position(sourceID);
        var targetPoint = pathContainer.position(targetID);
        return m('path', {
          key: sourceID + '-' + targetID,
          d: 'M' + sourcePoint.x + ',' + sourcePoint.y +
             'L' + targetPoint.x + ',' + targetPoint.y + 'Z',
          'data-source-id': sourceID,
          'data-target-id': targetID,
          config: function(element, isInitialized) {
            if (isInitialized)
              return;
            pathContainer.setPathElement(element, sourceID, targetID);
          }
        });
      })),
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
            m('.piece-header-delete-button', {
              className: dom.supportsTouch() ? '' : 'hoverable'
            }, '×')
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
                  m('.port-content-delete-button', {
                    className: dom.supportsTouch() ? '' : 'hoverable'
                  }, '×')
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
      m('.port-connector-out.drag', {
        className: connectorHandle.type() + ' ' + (connectorHandle.visible() ? '' : 'hide'),
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          connectorHandle.element(element);
          boardEvent.setConnectorHandle(connectorHandle);
        }
      })
    ]);
  };

  var BoardComponent = {
    controller: BoardController,
    view: boardView
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = BoardComponent;
  else
    app.BoardComponent = BoardComponent;
})(this.app || (this.app = {}));