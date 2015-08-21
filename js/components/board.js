var board = (function() {
  var mainPanel = null;
  var boardElement = null;
  var _pieceMap = {};
  var generateID = (function() {
    var base = Math.floor(Math.random() * Math.pow(10, 16));
    var count = 0;
    return function() {
      var hash = CryptoJS.SHA1(('0' + base + count).slice(-16) +
                               Math.random().toString().substring(1));
      count += 1;
      return hash.toString();
    };
  }());
  var connectorSizeOffset = 21;
  function element(value) {
    mainPanel = value.mainPanel;
    boardElement = value.board;
  }
  function append(piece) {
    var pieceID = generateID();
    piece.id(pieceID);
    _pieceMap[pieceID] = piece;
    boardElement.appendChild(piece.element());
  }
  function remove(piece) {
    piece.destroy();
    boardElement.removeChild(piece.element());
    var pieceID = piece.id();
    delete _pieceMap[pieceID];
  }
  function pieceMap() {
    return _pieceMap;
  }
  function showAllPieceComponentBack() {
    for (var key in _pieceMap) {
      _pieceMap[key].showComponentBack();
    }
  }
  function hideAllPieceComponentBack() {
    for (var key in _pieceMap) {
      _pieceMap[key].hideComponentBack();
    }
  }
  function getInConnectorNotConnectedElements(type) {
    var nodes = mainPanel.querySelectorAll('.port-connector-in');
    var notConnectedElements = [];
    for (var i = 0, len = nodes.length; i < len; i += 1) {
      var node = nodes[i];
      var portElement = node.parentNode.parentNode;
      if (dom.hasClass(portElement, type) &&
          dom.hasClass(node.nextElementSibling, 'hide')) {
        notConnectedElements.push(node);
      }
    }
    return notConnectedElements;
  }
  function getPort(portID) {
    var idSet = portID.split('/');
    var pieceID = idSet[0];
    var piece = _pieceMap[pieceID];
    var portMap = piece.portMap();
    return portMap[idSet[1] + '/' + idSet[2]];
  }
  function showPortConnectorConnected(portID) {
    var port = getPort(portID);
    port.showConnectorConnected();
  }
  function hidePortConnectorConnected(portID) {
    var port = getPort(portID);
    port.hideConnectorConnected();
  }
  function getOutConnectorElement(portID) {
    var port = getPort(portID);
    return port.getOutConnectorElement();
  }
  var isFF = (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1);
  function getConnectorOffset(element) {
    var offsetX = 0, offsetY = 0, count = 0;
    while (element && element.id !== 'main_panel') {
      var elementStyle = getComputedStyle(element, null);
      offsetX = offsetX + element.offsetLeft -
                parseInt(elementStyle.marginLeft || 0) +
                parseInt(isFF ? 0 : (elementStyle.borderLeftWidth || 0));
      offsetY = offsetY + element.offsetTop -
                parseInt(elementStyle.marginTop || 0) +
                parseInt(isFF ? 0 : (elementStyle.borderTopWidth || 0));
      element = element.offsetParent;
      count += 1;
    }
    return {x: offsetX, y: offsetY};
  }
  function getConnectorPositionMap(pieceID) {
    var map = {};
    var piece = _pieceMap[pieceID];
    var portMap = piece.portMap();
    for (var portName in portMap) {
      var port = portMap[portName];
      var outConnectorOffset = getConnectorOffset(port.getOutConnectorElement());
      map[pieceID + '/' + portName + '/out'] = {
        x: outConnectorOffset.x + connectorSizeOffset,
        y: outConnectorOffset.y + connectorSizeOffset
      };
      var inConnectorOffset = getConnectorOffset(port.getInConnectorElement());
      map[pieceID + '/' + portName + '/in'] = {
        x: inConnectorOffset.x + connectorSizeOffset - (isFF ? 0 : 4),
        y: inConnectorOffset.y + connectorSizeOffset - (isFF ? 0 : 4)
      };
    }
    return map;
  }
  function getConnectorSizeOffset() {
    return connectorSizeOffset;
  }
  function isLoading() {
    return (document.querySelectorAll('.piece.loading').length !== 0);
  }
  return {
    element: element,
    append: append,
    remove: remove,
    pieceMap: pieceMap,
    showAllPieceComponentBack: showAllPieceComponentBack,
    hideAllPieceComponentBack: hideAllPieceComponentBack,
    getInConnectorNotConnectedElements: getInConnectorNotConnectedElements,
    showPortConnectorConnected: showPortConnectorConnected,
    hidePortConnectorConnected: hidePortConnectorConnected,
    getOutConnectorElement: getOutConnectorElement,
    getConnectorOffset: getConnectorOffset,
    getConnectorPositionMap: getConnectorPositionMap,
    getConnectorSizeOffset: getConnectorSizeOffset,
    isLoading: isLoading
  };
}());