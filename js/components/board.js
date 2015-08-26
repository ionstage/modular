(function(app) {
  'use strict';
  var m = require('mithril');

  var Board = function(element) {
    this._element = element;
    this._pieceMap = {};
    this._connectorSizeOffset = 21;
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
    var port = this.getPort(portID);
    port.showConnectorConnected();
  };

  Board.prototype.hidePortConnectorConnected = function(portID) {
    var port = this.getPort(portID);
    port.hideConnectorConnected();
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

  Board.prototype.getConnectorPosition = function(connectorID) {
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
      connectorOffset = this.getConnectorOffset(port.getOutConnectorElement());
      return {
        x: connectorOffset.x + connectorSizeOffset,
        y: connectorOffset.y + connectorSizeOffset
      };
    } else if (connectorType === 'in') {
      connectorOffset = this.getConnectorOffset(port.getInConnectorElement());
      return {
        x: connectorOffset.x + connectorSizeOffset - (isFF() ? 0 : 4),
        y: connectorOffset.y + connectorSizeOffset - (isFF() ? 0 : 4)
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

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Board;
  else
    app.Board = Board;
})(this.app || (this.app = {}));