(function(global) {
  'use strict';
  var lib = global.lib;

  var isTouchEnabled = 'createTouch' in document;
  var START = isTouchEnabled ? 'touchstart' : 'mousedown';
  var MOVE = isTouchEnabled ? 'touchmove' : 'mousemove';
  var END = isTouchEnabled ? 'touchend' : 'mouseup';

  function el(selector) {
    return document.querySelector(selector);
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

  function indexOf(parentNode, childNode) {
    return Array.prototype.indexOf.call(parentNode.children, childNode);
  }

  function setCursor(value) {
    document.body.style.cursor = value;
  }

  function setMouseHoverEffect(element) {
    element.addEventListener('mouseover', function(event) {
      setCursor('pointer');
    }, false);
    element.addEventListener('mouseout', function(event) {
      setCursor('default');
    }, false);
  }

  function translate(el, x, y) {
    var value = 'translate(' + x + 'px, ' + y + 'px)';
    el.style.transform =  value;
    el.style.webkitTransform = value;
    el.style.MozTransform = value;
    el.style.msTransform = value;
    el.style.OTransform = value;
  }

  var requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           function(callback) {
             window.setTimeout(callback, 1000 / 60);
           };
  })().bind(window);

  function supportsTouch() {
    return isTouchEnabled;
  }

  function createNode(str) {
    var node = document.createElement('div');
    node.innerHTML = str.replace(/\r\n/g, '').trim();
    return node.firstChild;
  }

  global.dom = {
    el: el,
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
    indexOf: indexOf,
    setCursor: setCursor,
    setMouseHoverEffect: setMouseHoverEffect,
    translate: translate,
    requestAnimationFrame: requestAnimationFrame,
    supportsTouch: supportsTouch,
    createNode: createNode
  };
})(this);