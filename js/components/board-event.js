var boardEvent = (function(app) {
  var Base64 = require('js-base64').Base64;
  var m = require('mithril');
  var Port = app.Port || require('./port.js');
  
  var isTouchEnabled = dom.supportsTouch();
  var START = dom.eventType.START;
  var isLoadingURLHash = false;
  var connectorHandle = null;
  var board = null;
  var pathContainer = null;
  function createPorts(propData, eventData) {
    var ports = [], key, item, p;
    if (propData) {
      for (key in propData) {
        item = propData[key];
        p = new Port({
          type: 'prop',
          key: key,
          contentText: item.label,
          hasIn: item['in'] === true,
          hasOut: item.out === true,
          isDefault: item['default'] === true
        });
        ports.push(p);
      }
    }
    if (eventData) {
      for (key in eventData) {
        item = eventData[key];
        p = new Port({
          type: 'event',
          key: key,
          contentText: item.label,
          hasIn: item['in'] === true,
          hasOut: item.out === true,
          isDefault: item['default'] === true
        });
        ports.push(p);
      }
    }
    return ports;
  }
  function getPieceFromChildNode(childNode) {
    if (childNode.tagName.toLowerCase() === 'option')
      return null;
    while (childNode) {
      childNode = childNode.parentNode;
      if (childNode && childNode.className === 'piece'){
        var pieceMap = board.pieceMap();
        return pieceMap[childNode.getAttribute('data-piece-id')];
      }
    }
    return null;
  }
  var propDataCache = (function() {
    var cache = {};
    var serializeTargets = {};
    function set(pieceID, target, data) {
      if (!(pieceID in cache))
        cache[pieceID] = {};
      cache[pieceID][target] = data;
    }
    function get(pieceID, target) {
      if (pieceID in cache && target in cache[pieceID])
        return cache[pieceID][target];
      else
        return null;
    }
    function remove(pieceID) {
      delete cache[pieceID];
      delete serializeTargets[pieceID];
    }
    function setSerializeTarget(pieceID, target) {
      if (!(pieceID in serializeTargets))
        serializeTargets[pieceID] = [];
      serializeTargets[pieceID].push(target);
    }
    function serialize() {
      var data = [];
      for (var pieceID in serializeTargets) {
        var targets = serializeTargets[pieceID];
        for (var i = 0, len = targets.length; i < len; i += 1) {
          data.push({
            pieceID: pieceID,
            target: targets[i],
            data: cache[pieceID][targets[i]]
          });
        }
      }
      return data;
    }
    return {
      set: set,
      get: get,
      remove: remove,
      setSerializeTarget: setSerializeTarget,
      serialize: serialize
    };
  }());
  function dispatchBoardEvent(event) {
    var eventType = event.type;
    if (eventType === 'connect' || eventType === 'disconnect') {
      var targetPortIDSet = event.targetPortID.split('/');
      var pieceID = targetPortIDSet[0];
      var type = targetPortIDSet[1];
      if (type === 'event')
        return;
      var target = targetPortIDSet[2];
      var data;
      var isConnected;
      if (eventType === 'connect') {
        var sourcePortIDSet = event.sourcePortID.split('/');
        data = propDataCache.get(sourcePortIDSet[0], sourcePortIDSet[2]);
        isConnected = true;
      } else if (eventType === 'disconnect') {
        data = null;
        isConnected = false;
      }
      postMessageToPiece(pieceID, type, target, data, isConnected);
    }
  }
  function postMessageToPiece(pieceID, type, target, data, isConnected) {
    var sendData = {
      type: type,
      target: target
    };
    if (type === 'prop')
      sendData.data = data;
    sendData.isConnected = isConnected;
    var piece = board.pieceMap()[pieceID];
    if (piece) {
      var frame = piece.getComponentElement();
      frame.contentWindow.postMessage(JSON.stringify(sendData), '*');
    }
  }
  function flushConnection(sourcePortID, targetPortID) {
    var sourcePort = getPort(sourcePortID);
    var targetPort = getPort(targetPortID);
    var sourceID = sourcePortID + '/out';
    var targetID = targetPortID + '/in';
    sourcePort.setFlushOutConnector(true);
    targetPort.setFlushInConnector(true);
    targetPort.setFlushConnectorConnected(true);
    pathContainer.setFlushPath(sourceID, targetID, true);
    setTimeout(function() {
      sourcePort.setFlushOutConnector(false);
      targetPort.setFlushInConnector(false);
      targetPort.setFlushConnectorConnected(false);
      pathContainer.setFlushPath(sourceID, targetID, false);
    }, 160);
  }
  function printLog(message) {
    if (window.console && typeof console.warn === 'function')
      console.warn(message);
  }
  var updateURLHash = (function() {
    function mapConnection(connection, pieceIDMap) {
      var sourceIDSet = connection.sourceID.split('/');
      var targetIDSet = connection.targetID.split('/');
      return {
        source: pieceIDMap[sourceIDSet[0]] + '/' + sourceIDSet[1] + '/' + sourceIDSet[2],
        target: pieceIDMap[targetIDSet[0]] + '/' + targetIDSet[1] + '/' + targetIDSet[2]
      };
    }
    return lib.util.debounce(function() {
      if (isLoadingURLHash)
        return;
      var pieceMap = board.pieceMap();
      var pieceIDMap = {};
      var count = 0;
      var pieces = [];
      for (var pieceID in pieceMap) {
        var pieceAttr = pieceMap[pieceID].getAttribute();
        pieceAttr.id = count;
        pieceIDMap[pieceID] = count;
        pieces[count] = pieceAttr;
        count += 1;
      }
      var connections = pathContainer.getConnectionList();
      for (var i = 0, len = connections.length; i < len; i += 1) {
        connections[i] = mapConnection(connections[i], pieceIDMap);
      }
      var cacheDataList = propDataCache.serialize();
      for (var i = 0, len = cacheDataList.length; i < len; i += 1) {
        var pieceID = cacheDataList[i].pieceID;
        cacheDataList[i].id = pieceIDMap[pieceID];
        delete cacheDataList[i].pieceID;
      }
      var hashText = '';
      if (pieces.length > 0) {
        hashText = Base64.encodeURI(JSON.stringify({
          node: pieces,
          link: connections,
          data: cacheDataList
        }));
      }
      location.replace('#' + hashText);
      var urlLen = location.href.length;
      if (urlLen > 2083)
        printLog('Too long URL(' + urlLen + ' words)');
    }, 100);
  }());
  function createAndAppendPiece(attr) {
    var p = piece.create(attr.src);
    p.position({x: attr.x, y: attr.y});
    p.updatePosition();
    board.append(p);
    return p.id();
  }
  function createAndAppendConnection(connection, pieceIDMap) {
    if (connection.target === 'drag')
      return;
    var sourceSet = connection.source.split('/');
    var sourcePortID = pieceIDMap[sourceSet[0]] + '/' + sourceSet[1] + '/' + sourceSet[2];
    var targetSet = connection.target.split('/');
    var targetPortID = pieceIDMap[targetSet[0]] + '/' + targetSet[1] + '/' + targetSet[2];
    connectPort(sourcePortID, targetPortID);
  }
  function loadURLHash() {
    isLoadingURLHash = true;
    var hashText = location.hash.substring(1);
    if (hashText) {
      try {
        var data = JSON.parse(Base64.decode(hashText));
      } catch (e) {
        if (window.console && typeof console.error === 'function')
          console.error(e);
        isLoadingURLHash = false;
        return;
      }
      var pieces = data.node;
      var pieceIDMap = {};
      for (var i = 0, len = pieces.length; i < len; i += 1) {
        var pieceAttr = pieces[i];
        var pieceID = createAndAppendPiece(pieceAttr);
        pieceIDMap[pieceAttr.id] = pieceID;
      }
      var retryCount = 0;
      setTimeout(function waitLoadPiece() {
        m.redraw(true);
        if (!board.isLoading()) {
          var cacheDataList = data.data;
          for (var i = 0, len = cacheDataList.length; i < len; i += 1) {
            var cacheData = cacheDataList[i];
            var pieceID = pieceIDMap[cacheData.id];
            postMessageToPiece(pieceID, 'prop', cacheData.target, cacheData.data, false);
          }
          var connections = data.link;
          for (var i = 0, len = connections.length; i < len; i += 1) {
            var connection = connections[i];
            createAndAppendConnection(connection, pieceIDMap);
          }
          isLoadingURLHash = false;
        } else {
          if (retryCount < 100) {
            setTimeout(waitLoadPiece, 100);
            retryCount += 1;
          } else {
            location.replace('#' + hashText);
            printLog('Load time out');
            isLoadingURLHash = false;
          }
        }
      }, 100);
    } else {
      location.replace('#');
      isLoadingURLHash = false;
    }
  }
  function setWindowMessageListener() {
    window.addEventListener('message', function(event) {
      try {
        var eventData = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      var pieceID = eventData.id;
      var piece = board.pieceMap()[pieceID];
      if (typeof piece === 'undefined')
        return;
      var data = eventData.data;
      var type = eventData.type;
      var target = eventData.target;
      switch (type) {
        case 'load':
          if (!piece.isLoading())
            return;
          piece.label(data.label);
          piece.componentHeight(data.componentHeight);
          var ports = createPorts(data.prop, data.event);
          piece.setPorts(ports);
          piece.vitalize();
          var propData = data.prop;
          for (var target in propData) {
            if ('data' in propData[target])
              propDataCache.set(pieceID, target, propData[target].data);
            if (propData[target].serialize === true)
              propDataCache.setSerializeTarget(pieceID, target);
          }
          m.redraw();
          break;
        case 'prop':
          propDataCache.set(pieceID, target, data);
          var targetIDs = pathContainer.getTargetIDs(pieceID + '/prop/' + target + '/out');
          for (var i = 0, len = targetIDs.length; i < len; i += 1) {
            var targetID = targetIDs[i];
            if (targetID === 'drag')
              continue;
            var targetIDSet = targetID.split('/');
            var pieceID = targetIDSet[0];
            var target = targetIDSet[2];
            postMessageToPiece(pieceID, 'prop', target, data, true);
          }
          break;
        case 'event':
          var sourcePortID = pieceID + '/event/' + target;
          var targetIDs = pathContainer.getTargetIDs(sourcePortID + '/out');
          for (var i = 0, len = targetIDs.length; i < len; i += 1) {
            var targetID = targetIDs[i];
            if (targetID === 'drag')
              continue;
            var targetIDSet = targetID.split('/');
            var pieceID = targetIDSet[0];
            var target = targetIDSet[2];
            postMessageToPiece(pieceID, 'event', target, null, true);
            var targetPortID = targetID.replace(/\/in$/, '');
            flushConnection(sourcePortID, targetPortID);
          }
          break;
        default:
          break;
      }
      updateURLHash();
    }, false);
  }
  function setMainPanelStartListener(mainPanelElement) {
    mainPanelElement.addEventListener(START, function(event) {
      var target = event.target;
      if (dom.hasClass(target, 'loading'))
        return;
      var className = event.target.className.toString().split(' ')[0];
      var piece = getPieceFromChildNode(target);
      if (piece) {
        piece.toFront();
        piece.updatePosition();
        var tagName = target.tagName.toLowerCase();
        if (tagName !== 'select' &&
            document.activeElement && document.activeElement.blur)
          document.activeElement.blur();
      }
      switch (className) {
        case 'port-content-delete-button':
          hidePort(event);
          break;
        case 'piece-header-delete-button':
          removePiece(event);
          break;
        case 'piece-header-title':
          dragPiece(event);
          break;
        case 'port-content-text':
          sortPort(event);
          break;
        case 'port-connector-out':
          dragPortConnectorOut(event);
          break;
        case 'port-connector-connected':
          dragPortConnectorOut(event, true);
          break;
        default:
          break;
      }
    }, false);
  }
  function element(elementMap) {
    setWindowMessageListener();
    setMainPanelStartListener(elementMap.mainPanel);
  }
  function setConnectorHandle(component) {
    connectorHandle = component;
  }
  function setBoard(component) {
    board = component;
  }
  function setPathContainer(component) {
    pathContainer = component;
  }
  function addPiece(x, y, label, src) {
    var p = piece.create(src);
    p.label(label);
    p.position({x: x, y: y});
    p.updatePosition();
    board.append(p);
  }
  function showPort(event) {
    var portIDSet = event.target.value.split('/');
    var pieceID = portIDSet[0];
    var piece = board.pieceMap()[pieceID];
    var portMap = piece.portMap();
    var portName = portIDSet[1] + '/' + portIDSet[2];
    piece.showPort(portMap[portName]);
  }
  function getPort(portID) {
    var portIDSet = portID.split('/');
    var pieceID = portIDSet[0];
    var piece = board.pieceMap()[pieceID];
    var portMap = piece.portMap();
    var portName = portIDSet[1] + '/' + portIDSet[2];
    return portMap[portName];
  }
  function connectPort(sourcePortID, targetPortID) {
    if (sourcePortID === null || targetPortID === null)
      return;
    var pieceMap = board.pieceMap();
    var sourcePieceID = sourcePortID.split('/')[0];
    var targetPieceID = targetPortID.split('/')[0];
    var sourcePiece = pieceMap[sourcePieceID];
    var targetPiece = pieceMap[targetPieceID];
    var sourcePort = getPort(sourcePortID);
    var targetPort = getPort(targetPortID);
    sourcePiece.showPort(sourcePort);
    targetPiece.showPort(targetPort);
    if (!targetPort.element())
      m.redraw(true);
    targetPort.showConnectorConnected();
    pathContainer.append(sourcePortID + '/out', targetPortID + '/in');
    updatePathPosition(sourcePieceID);
    updatePathPosition(targetPieceID);
    pathContainer.updatePosition();
    dispatchBoardEvent({
      type: 'connect',
      sourcePortID: sourcePortID,
      targetPortID: targetPortID
    });
  }
  function disconnectPort(sourcePortID, targetPortID) {
    if (sourcePortID === null || targetPortID === null)
      return;
    var targetPort = getPort(targetPortID);
    targetPort.hideConnectorConnected();
    pathContainer.remove(sourcePortID, targetPortID);
    dispatchBoardEvent({
      type: 'disconnect',
      sourcePortID: sourcePortID.replace(/\/out$/, ''),
      targetPortID: targetPortID.replace(/\/in$/, '')
    });
  }
  function removePortConnection(portID) {
    var sourcePortID = portID + '/out';
    var sourceTargetIDs = pathContainer.getTargetIDs(sourcePortID);
    for (var i = 0, len = sourceTargetIDs.length; i < len; i += 1) {
      disconnectPort(sourcePortID, sourceTargetIDs[i]);
    }
    var targetPortID = portID + '/in';
    disconnectPort(pathContainer.getSourceID(targetPortID), targetPortID);
  }
  var hidePort = (function() {
    function tapListener(event) {
      var portID = event.target.parentNode.parentNode.getAttribute('data-port-id');
      var portIDSet = portID.split('/');
      var pieceID = portIDSet[0];
      var piece = board.pieceMap()[pieceID];
      var portMap = piece.portMap();
      var portName = portIDSet[1] + '/' + portIDSet[2];
      piece.hidePort(portMap[portName]);
      removePortConnection(portID);
      updatePathPosition(pieceID);
      pathContainer.updatePosition();
      pathContainer.refreshPosition();
    }
    return function(event) {
      dom.startTapEvent(event, {
        tap: function() {
          tapListener(event);
        }
      });
    };
  }());
  function removePiece(event) {
    var pieceID = event.target.parentNode.parentNode.getAttribute('data-piece-id');
    var piece = board.pieceMap()[pieceID];
    if (isTouchEnabled)
      dom.addClass(piece.element(), 'delete');
    dom.startTapEvent(event, {
      tap: function() {
        board.remove(piece);
        propDataCache.remove(pieceID);
        if (isTouchEnabled)
          dom.removeClass(piece.element(), 'delete');
        updateURLHash();
      },
      cancel: function() {
        if (isTouchEnabled)
          dom.removeClass(piece.element(), 'delete');
      }
    });
  }
  function updatePathPosition(pieceID, isSortingPort) {
    pathContainer.getConnectionList().forEach(function(connection) {
      var sourceID = connection.sourceID;
      var targetID = connection.targetID;
      var sourcePieceID = sourceID.split('/')[0];
      var targetPieceID = targetID.split('/')[0];
      if (sourcePieceID === pieceID)
        pathContainer.position(sourceID, board.getConnectorPosition(sourceID, isSortingPort));
      if(targetPieceID === pieceID)
        pathContainer.position(targetID, board.getConnectorPosition(targetID, isSortingPort));
    });
  }
  function dragPiece(event) {
    var pieceID = event.target.parentNode.parentNode.getAttribute('data-piece-id');
    var piece = board.pieceMap()[pieceID];
    var piecePosition = piece.position();
    var startX = piecePosition.x;
    var startY = piecePosition.y;
    var isDragging = true;
    function updatePiecePosition() {
      if (isDragging) {
        dom.requestAnimationFrame(updatePiecePosition);
        piece.updatePosition();
        pathContainer.updatePosition();
      }
    }
    dom.startDragEvent(event, {
      drag: function(dx, dy) {
        piece.position({x: startX + dx, y: startY + dy});
        updatePathPosition(pieceID);
      },
      end: function(dx, dy) {
        board.endDrag();
        isDragging = false;
        dom.requestAnimationFrame(function() {
          piece.position({x: startX + dx, y: startY + dy});
          piece.updatePosition();
          updatePathPosition(pieceID);
          pathContainer.updatePosition();
          pathContainer.refreshPosition();
        });
        if (isTouchEnabled)
          dom.removeClass(piece.element(), 'drag');
        updateURLHash();
        m.redraw();
      }
    });
    board.startDrag();
    dom.requestAnimationFrame(updatePiecePosition);
    if (isTouchEnabled)
      dom.addClass(piece.element(), 'drag');
  }
  function sortPort(event) {
    var portElement = event.target.parentNode.parentNode;
    var portListElement = portElement.parentNode;
    var portID = portElement.getAttribute('data-port-id');
    var placeholderElement = portElement.cloneNode();
    var index = dom.indexOf(portListElement, portElement);
    var portElementHeight = 46;
    var startY = portElementHeight * index;
    var maxY = portElementHeight * (portListElement.children.length - 1);
    var isDragging = true;
    var portTop;
    var portListElementChildren;
    var prePlaceholderIndex;
    var pieceID = portID.split('/')[0];
    var piece = board.pieceMap()[pieceID];
    function updatePortPosition() {
      if (isDragging) {
        dom.requestAnimationFrame(updatePortPosition);
        portElement.style.top = portTop + 'px';
        pathContainer.updatePosition();
      }
    }
    dom.startDragEvent(event, {
      drag: function(dx, dy) {
        var top = startY + dy;
        if (top < 0)
          top = 0;
        if (top > maxY)
          top = maxY;
        portTop = top;
        var moveIndex = parseInt((portTop - startY) / portElementHeight + ((dy > 0) ? 0.5 : -0.5));
        var placeholderIndex = index + moveIndex + (moveIndex >= 0 ? 1 : 0);
        if (prePlaceholderIndex !== placeholderIndex) {
          portListElement.insertBefore(placeholderElement, portListElementChildren[placeholderIndex] || null);
          prePlaceholderIndex = placeholderIndex;
        }
        updatePathPosition(pieceID, true);
      },
      end: function(dx, dy) {
        board.endDrag();
        isDragging = false;
        dom.requestAnimationFrame(function() {
          portElement.style.cssText = '';
          portListElement.insertBefore(portElement, placeholderElement);
          dom.removeClass(portElement, 'drag');
          portListElement.removeChild(placeholderElement);
          updatePathPosition(pieceID, true);
          pathContainer.updatePosition();
          pathContainer.refreshPosition();
          piece.updatePortListOrder();
        });
      }
    });
    board.startDrag();
    dom.addClass(placeholderElement, 'placeholder');
    dom.addClass(portElement, 'drag');
    portListElement.insertBefore(placeholderElement, portElement.nextSibling);
    portListElementChildren = portListElement.querySelectorAll('.port:not(.drag)');
    dom.requestAnimationFrame(updatePortPosition);
  }
  var dragPortConnectorOut = (function() {
    var hasClass = dom.hasClass;
    var isFF = (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1);
    function getInConnectorPositionMap(type) {
      var inConnectorElements = board.getInConnectorNotConnectedElements(type);
      var connectorSizeOffset = board.getConnectorSizeOffset();
      var map = {};
      for (var i = 0, len = inConnectorElements.length; i < len; i += 1) {
        var element = inConnectorElements[i];
        var portID = element.parentNode.parentNode.getAttribute('data-port-id');
        var offset = board.getConnectorOffset(inConnectorElements[i]);
        offset.x += connectorSizeOffset - (isFF ? 0 : 4);
        offset.y += connectorSizeOffset - (isFF ? 0 : 4);
        map[portID] = offset;
      }
      return map;
    }
    function getInConnectorPositionMapForSearch(positionMap) {
      var map = {};
      for (var portID in positionMap) {
        var offset = positionMap[portID];
        var x = offset.x, y = offset.y;
        if (!(x in map))
          map[x] = {};
        map[x][y] = portID;
      }
      return map;
    }
    function abs(n) {
      return n > 0 ? n : -n;
    }
    function getIntersectConnector(searchMap, point) {
      var connectorSizeOffset = board.getConnectorSizeOffset();
      var pointX = point.x, pointY = point.y;
      for (var x in searchMap) {
        if (abs(pointX - x) < connectorSizeOffset) {
          var searchMapForY = searchMap[x];
          for (var y in searchMapForY) {
            if (abs(pointY - y) < connectorSizeOffset) {
              return {
                portID: searchMapForY[y],
                point: {x: x, y: y}
              };
            }
          }
        }
      }
      return null;
    }
    function getPortType(portElement) {
      if (dom.hasClass(portElement, 'prop'))
        return 'prop';
      else if (dom.hasClass(portElement, 'event'))
        return 'event';
    }
    return function(event, isConnected) {
      var connectorSizeOffset = board.getConnectorSizeOffset();
      var target = event.target;
      var connectorOutElement;
      if (isConnected) {
        var portID = target.parentNode.parentNode.getAttribute('data-port-id');
        var sourceID = pathContainer.getSourceID(portID + '/in');
        var outConnectorElement = board.getOutConnectorElement(sourceID.replace(/\/out/, ''));
        connectorOutElement = outConnectorElement;
      } else {
        connectorOutElement = target;
      }
      if (hasClass(connectorOutElement, 'drag'))
        return;
      var connectorOffset = board.getConnectorOffset(connectorOutElement);
      var portElement = connectorOutElement.parentNode.parentNode;
      var portID = portElement.getAttribute('data-port-id');
      var connectorPoint = {
        x: connectorOffset.x + connectorSizeOffset,
        y: connectorOffset.y + connectorSizeOffset
      };
      var targetOffset = board.getConnectorOffset(target);
      var targetPoint = {
        x: targetOffset.x + connectorSizeOffset,
        y: targetOffset.y + connectorSizeOffset
      };
      var positionMap = getInConnectorPositionMap(getPortType(portElement));
      if (isConnected) {
        var connectedPortID = target.parentNode.parentNode.getAttribute('data-port-id');
        positionMap[connectedPortID] = targetPoint;
      }
      var positionSearchMap = getInConnectorPositionMapForSearch(positionMap);
      var currentPathSourceID;
      var currentPathTargetID;
      var isDragging = true;
      function updatePortConnector() {
        if (isDragging) {
          dom.requestAnimationFrame(updatePortConnector);
          connectorHandle.update();
          pathContainer.updatePosition();
          board.updatePortConnectorConnected();
        }
      }
      function startConnectorHandle() {
        connectorHandle.position(connectorOffset);
        connectorHandle.update();
        if (hasClass(portElement, 'prop'))
          connectorHandle.type('prop');
        else if (hasClass(portElement, 'event'))
          connectorHandle.type('event');
      }
      dom.startDragEvent(event, {
        drag: function(dx, dy) {
          connectorHandle.position({
            x: targetOffset.x + dx,
            y: targetOffset.y + dy,
          });
          var dragPoint = {
            x: targetPoint.x + dx,
            y: targetPoint.y + dy
          };
          var interSectConnector = getIntersectConnector(positionSearchMap, dragPoint);
          var currentPortID = currentPathTargetID.replace(/\/in$/, '');
          if (interSectConnector !== null) {
            var targetID = interSectConnector.portID + '/in';
            if (targetID !== currentPathTargetID) {
              var prePathTargetID = currentPathTargetID;
              pathContainer.change([currentPathSourceID, currentPathTargetID],
                                 [currentPathSourceID, targetID]);
              currentPathTargetID = targetID;
              pathContainer.position(targetID, interSectConnector.point);
              connectorHandle.hide();
              board.showPortConnectorConnected(interSectConnector.portID);
              if (currentPortID !== 'drag') {
                board.hidePortConnectorConnected(currentPortID);
                var prePathTargetPortID = prePathTargetID.replace(/\/in$/, '');
                dispatchBoardEvent({
                  type: 'disconnect',
                  sourcePortID: currentPathSourceID.replace(/\/out$/, ''),
                  targetPortID: prePathTargetPortID
                });
                if (isTouchEnabled)
                  getPort(prePathTargetPortID).clearMark();
              }
              var currentPathTargetPortID = currentPathTargetID.replace(/\/in$/, '');
              dispatchBoardEvent({
                type: 'connect',
                sourcePortID: currentPathSourceID.replace(/\/out$/, ''),
                targetPortID: currentPathTargetPortID
              });
              if (isTouchEnabled)
                getPort(currentPathTargetPortID).mark();
            }
          } else {
            var targetID = 'drag';
            if (targetID !== currentPathTargetID) {
              var prePathTargetID = currentPathTargetID;
              pathContainer.change([currentPathSourceID, currentPathTargetID],
                                   [currentPathSourceID, targetID]);
              currentPathTargetID = targetID;
              if (currentPortID !== 'drag')
                board.hidePortConnectorConnected(currentPortID);
              connectorHandle.show();
              var prePathTargetPortID = prePathTargetID.replace(/\/in$/, '');
              dispatchBoardEvent({
                type: 'disconnect',
                sourcePortID: currentPathSourceID.replace(/\/out$/, ''),
                targetPortID: prePathTargetPortID
              });
              if (isTouchEnabled)
                getPort(prePathTargetPortID).clearMark();
            }
            pathContainer.position(targetID, dragPoint);
          }
        },
        end: function(dx, dy) {
          board.endDrag();
          isDragging = false;
          dom.requestAnimationFrame(function() {
            connectorHandle.hide();
            connectorHandle.position({
              x: -connectorSizeOffset * 2,
              y: -connectorSizeOffset * 2
            });
            connectorHandle.update();
            pathContainer.remove(currentPathSourceID, 'drag');
            pathContainer.refreshPosition();
            dom.setCursor('default');
          });
          if (isTouchEnabled) {
            getPort(portID).clearMark();
            if (currentPathTargetID !== 'drag') {
              var currentPathTargetPortID = currentPathTargetID.replace(/\/in$/, '');
              getPort(currentPathTargetPortID).clearMark();
            }
          }
          updateURLHash();
        }
      });
      board.startDrag();
      startConnectorHandle();
      currentPathSourceID = portID + '/out';
      if (isConnected) {
        currentPathTargetID = connectedPortID + '/in';
        connectorHandle.hide();
      } else {
        currentPathTargetID = 'drag';
        connectorHandle.show();
      }
      pathContainer.append(currentPathSourceID, currentPathTargetID);
      pathContainer.position(currentPathSourceID, connectorPoint);
      pathContainer.position(currentPathTargetID, targetPoint);
      pathContainer.updatePosition();
      if (isTouchEnabled) {
        dom.requestAnimationFrame(function() {
          getPort(portID).mark();
          if (isConnected)
            getPort(connectedPortID).mark();
        });
      }
      dom.setCursor('crosshair');
      dom.requestAnimationFrame(updatePortConnector);
    };
  }());
  return {
    element: element,
    setConnectorHandle: setConnectorHandle,
    setBoard: setBoard,
    setPathContainer: setPathContainer,
    addPiece: addPiece,
    showPort: showPort,
    removePortConnection: removePortConnection,
    loadURLHash: loadURLHash
  };
})(this.app || (this.app = {}));