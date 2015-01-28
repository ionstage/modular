(function(window, undefined) {
  'use strict';
  var document = window.document;
  var piece = (function() {
    var _propData;
    var _eventData;
    var _propConnectMap = {};
    var _eventConnectMap = {};
    var isInitialized = false;
    var isDOMContentloaded = false;
    document.addEventListener('DOMContentLoaded', function() {
      isDOMContentloaded = true;
    }, false);
    var pieceID = null;
    function createPropData(data) {
      if (!data)
        return null;
      var propData = {};
      for (var target in data) {
        var srcData = data[target];
        var destData = {label: srcData.label};
        if (typeof srcData.in === 'function')
          destData.in = true;
        if (typeof srcData.out === 'function') {
          destData.out = true;
          destData.data = srcData.out();
        }
        if (srcData.default === true)
          destData.default = true;
        if (srcData.serialize === true)
          destData.serialize = true;
        propData[target] = destData;
      }
      return propData;
    }
    function createEventData(data) {
      if (!data)
        return null;
      var eventData = {};
      for (var target in data) {
        var srcData = data[target];
        var destData = {label: srcData.label};
        if (typeof srcData.in === 'function')
          destData.in = true;
        if (typeof srcData.out === 'function')
          destData.out = true;
        if (srcData.default === true)
          destData.default = true;
        eventData[target] = destData;
      }
      return eventData;
    }
    function setWindowMessageEvent() {
      var propData = _propData, eventData = _eventData;
      window.addEventListener('message', function(event) {
        try {
          var data = JSON.parse(event.data);
        } catch (e) {
          return;
        }
        var type = data.type;
        var target = data.target;
        switch (type) {
          case 'prop':
            if (target in propData && typeof propData[target].in === 'function') {
              _propConnectMap[target] = data.isConnected;
              propData[target].in(data.data);
            }
            break;
          case 'event':
            if (target in eventData && typeof eventData[target].in === 'function') {
              _eventConnectMap[target] = data.isConnected;
              eventData[target].in();
            }
            break;
          default:
            break;
        }
      }, false);
    }
    function postMessageToBoard(data) {
      var sendData = {
        id: pieceID,
        type: 'load',
        data: {
          label: data.label || ''
        }
      };
      var componentHeight = document.body.clientHeight + 'px';
      sendData.data.componentHeight = componentHeight;
      _propData = data.prop;
      var propData = createPropData(data.prop);
      if (propData)
        sendData.data.prop = propData;
      _eventData = data.event;
      var eventData = createEventData(data.event);
      if (eventData)
        sendData.data.event = eventData;
      setWindowMessageEvent();
      window.parent.postMessage(JSON.stringify(sendData), '*');
    }
    function initialize(data) {
      if (isInitialized)
        return;
      isInitialized = true;
      pieceID = location.hash.substring(1);
      if (!pieceID)
        return;
      if (isDOMContentloaded)
        postMessageToBoard(data);
      else
        document.addEventListener('DOMContentLoaded', function() {
          postMessageToBoard(data);
        }, false);
    }
    function updateProperty(target) {
      var propData = _propData;
      if (target in propData && typeof propData[target].out === 'function') {
        window.parent.postMessage(JSON.stringify({
          id: pieceID,
          type: 'prop',
          target: target,
          data: propData[target].out()
        }), '*');
      }
    }
    function dispatchEvent(target) {
      var eventData = _eventData;
      if (target in eventData && typeof eventData[target].out === 'function') {
        window.parent.postMessage(JSON.stringify({
          id: pieceID,
          type: 'event',
          target: target,
          data: eventData[target].out()
        }), '*');
      }
    }
    function isConnectedProperty(target) {
      return _propConnectMap[target] || false;
    }
    function isConnectedEvent(target) {
      return _eventConnectMap[target] || false;
    }
    return {
      initialize: initialize,
      updateProperty: updateProperty,
      dispatchEvent: dispatchEvent,
      isConnectedProperty: isConnectedProperty,
      isConnectedEvent: isConnectedEvent,
      noop: function() {}
    };
  }());
  window.piece = piece;
}(this));