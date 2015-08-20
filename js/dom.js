(function(global) {
  'use strict';
  var lib = global.lib;

  var isTouchEnabled = 'createTouch' in document;
  var START = isTouchEnabled ? 'touchstart' : 'mousedown';
  var MOVE = isTouchEnabled ? 'touchmove' : 'mousemove';
  var END = isTouchEnabled ? 'touchend' : 'mouseup';

  function el(selector, namespace) {
    if (selector[0] === '<') {
      selector = selector.match(/<(.+)>/)[1];
      if (namespace)
        return document.createElementNS(namespace, selector);
      else
        return document.createElement(selector);
    }
    return document.querySelector(selector);
  }

  function getTarget(event) {
    if (isTouchEnabled) {
      var touch = event.changedTouches[0];
      return document.elementFromPoint(touch.clientX, touch.clientY);
    } else {
      return event.target;
    }
  }

  var tappable = (function() {
    var Tappable = function(option) {
      var noop = function() {};
      var element = this._element = option.element;

      this._move = move.bind(this);
      this._end = end.bind(this);
      this._ontap = option.ontap || noop;
      this._onstart = option.onstart || noop;
      this._onout = option.onout || noop;
      this._onover = option.onover || noop;

      element.addEventListener(START, start.bind(this));
    };

    var start = function(event) {
      event.preventDefault();
      event.stopPropagation();

      this._previousTarget = event.currentTarget;

      document.addEventListener(MOVE, this._move);
      document.addEventListener(END, this._end);

      this._onstart();
    };

    var move = function(event) {
      event.preventDefault();
      event.stopPropagation();

      var target = getTarget(event);

      if (target === this._previousTarget)
        return;

      if (target === this._element)
        this._onover();
      else
        this._onout();

      this._previousTarget = target;
    };

    var end = function(event) {
      event.preventDefault();
      event.stopPropagation();

      document.removeEventListener(MOVE, this._move);
      document.removeEventListener(END, this._end);

      if (getTarget(event) === this._element)
        this._ontap();
    };

    return function(option) {
      new Tappable(option);
    };
  })();

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

  function removeKeyboardFocus() {
    var activeElement = document.activeElement;
    if (activeElement && activeElement.blur)
      activeElement.blur();
  }

  function windowWidth() {
    return window.innerWidth;
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
    tappable: tappable,
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
    removeKeyboardFocus: removeKeyboardFocus,
    windowWidth: windowWidth,
    translate: translate,
    requestAnimationFrame: requestAnimationFrame,
    supportsTouch: supportsTouch,
    createNode: createNode
  };
})(this);