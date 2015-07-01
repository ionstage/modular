(function(global) {
  'use strict';
  var lib = global.lib;

  var isTouchEnabled = lib.support.touch;
  var START = isTouchEnabled ? 'touchstart' : 'mousedown';
  var MOVE = isTouchEnabled ? 'touchmove' : 'mousemove';
  var END = isTouchEnabled ? 'touchend' : 'mouseup';

  function getElement() {
    var map = {};
    var nodeList = document.querySelectorAll('[id]');
    for (var i = 0, len = nodeList.length; i < len; i += 1) {
      var node = nodeList[i];
      map[lib.util.camelCase(node.id, '_')] = node;
    }
    return map;
  }

  function setTapEvent(element, option) {
    element.addEventListener(START, function(event) {
      startTapEvent(event, option);
    }, false);
  }

  function startTapEvent(event, option) {
    var target = event.currentTarget, startOffset;
    function moveListener(event) {
      event.preventDefault();
      event.stopPropagation();
      event = isTouchEnabled ? event.touches[0] : event;
      var dx = Math.abs(event.pageX - startOffset.left);
      var dy = Math.abs(event.pageY - startOffset.top);
      if (dx > 5 || dy > 5) {
        target.removeEventListener(MOVE, moveListener, false);
        target.removeEventListener(END, endListener, false);
        if (typeof option.cancel === 'function')
          requestAnimationFrame(option.cancel);
      }
    }
    function endListener(event) {
      event.preventDefault();
      event.stopPropagation();
      target.removeEventListener(MOVE, moveListener, false);
      target.removeEventListener(END, endListener, false);
      if (typeof option.tap === 'function')
        requestAnimationFrame(option.tap);
    }
    event.preventDefault();
    event.stopPropagation();
    event = isTouchEnabled ? event.touches[0] : event;
    startOffset = {left: event.pageX, top: event.pageY};
    target.addEventListener(MOVE, moveListener, false);
    target.addEventListener(END, endListener, false);
  }

  function startDragEvent(event, option) {
    var startOffset;
    function moveListener(event) {
      event.preventDefault();
      event.stopPropagation();
      event = isTouchEnabled ? event.touches[0] : event;
      var dx = event.pageX - startOffset.left;
      var dy = event.pageY - startOffset.top;
      if (typeof option.drag === 'function')
        option.drag(dx, dy);
    }
    function endListener(event) {
      event.preventDefault();
      event.stopPropagation();
      if (isTouchEnabled && event.touches.length > 0)
        return;
      event = isTouchEnabled ? event.changedTouches[0] : event;
      document.removeEventListener(MOVE, moveListener, false);
      document.removeEventListener(END, endListener, false);
      var dx = event.pageX - startOffset.left;
      var dy = event.pageY - startOffset.top;
      if (typeof option.end === 'function')
        option.end(dx, dy);
    }
    event.preventDefault();
    event.stopPropagation();
    event = isTouchEnabled ? event.touches[0] : event;
    startOffset = {left: event.pageX, top: event.pageY};
    document.addEventListener(MOVE, moveListener, false);
    document.addEventListener(END, endListener, false);
  }

  function hasClass(element, className) {
    var elementClassName = element.className;
    return (elementClassName + ' ').indexOf(className + ' ') !== -1;
  }

  function addClass(element, className) {
    var elementClassName = element.className;
    if ((' ' + elementClassName).indexOf(' ' + className) === -1)
      element.className = (elementClassName + ' ' + className).trim();
  }

  function removeClass(element, className) {
    if (typeof className === 'undefined')
      element.className = '';
    if (hasClass(element, className))
      element.className = (element.className + ' ').replace(className + ' ', '').trim();
  }

  function makeCSSText(styleMap) {
    var cssText = '';
    for (var key in styleMap) {
      cssText = cssText + key + ':' + styleMap[key] + ';';
    }
    return cssText;
  }

  function indexOf(parentNode, node) {
    var children = parentNode.children;
    for (var i = 0, len = children.length; i < len; i += 1) {
      if (children[i] === node)
        return i;
    }
    return -1;
  }

  global.dom = {
    getElement: getElement,
    setTapEvent: setTapEvent,
    startTapEvent: startTapEvent,
    startDragEvent: startDragEvent,
    eventType: {
      START: START,
      MOVE: MOVE,
      END: END
    },
    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    makeCSSText: makeCSSText,
    indexOf: indexOf
  };
})(this);