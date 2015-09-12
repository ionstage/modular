(function(global) {
  'use strict';
  var isTouchEnabled = 'createTouch' in document;
  var START = isTouchEnabled ? 'touchstart' : 'mousedown';
  var MOVE = isTouchEnabled ? 'touchmove' : 'mousemove';
  var END = isTouchEnabled ? 'touchend' : 'mouseup';

  var cancelEvent = function(event) {
    event.preventDefault();
    event.stopPropagation();
  };

  var tappable = (function() {
    var Tappable = function(option) {
      var element = this.element = option.element;

      this.move = move.bind(this);
      this.end = end.bind(this);
      this.ontap = option.ontap || noop;
      this.ondown = option.ondown || noop;
      this.onout = option.onout || noop;
      this.onover = option.onover || noop;

      element.addEventListener(START, start.bind(this));
    };

    var noop = function() {};

    var start = function(event) {
      cancelEvent(event);

      this.previousTarget = event.currentTarget;

      document.addEventListener(MOVE, this.move);
      document.addEventListener(END, this.end);

      this.ondown();
    };

    var move = function(event) {
      cancelEvent(event);

      var target = getTarget(event);

      if (target === this.previousTarget)
        return;

      if (target === this.element)
        this.onover();
      else
        this.onout();

      this.previousTarget = target;
    };

    var end = function(event) {
      cancelEvent(event);

      document.removeEventListener(MOVE, this.move);
      document.removeEventListener(END, this.end);

      if (getTarget(event) === this.element)
        this.ontap();
    };

    var getTarget = function(event) {
      if (isTouchEnabled) {
        var touch = event.changedTouches[0];
        return document.elementFromPoint(touch.clientX, touch.clientY);
      } else {
        return event.target;
      }
    };

    return function(option) {
      new Tappable(option);
    };
  })();

  function startTapEvent(event, option) {
    var target = event.currentTarget, startOffset;
    function moveListener(event) {
      cancelEvent(event);
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
      cancelEvent(event);
      target.removeEventListener(MOVE, moveListener, false);
      target.removeEventListener(END, endListener, false);
      if (typeof option.tap === 'function')
        requestAnimationFrame(option.tap);
    }
    cancelEvent(event);
    event = isTouchEnabled ? event.touches[0] : event;
    startOffset = {left: event.pageX, top: event.pageY};
    target.addEventListener(MOVE, moveListener, false);
    target.addEventListener(END, endListener, false);
  }

  function startDragEvent(event, option) {
    var startOffset;
    function moveListener(event) {
      cancelEvent(event);
      event = isTouchEnabled ? event.touches[0] : event;
      var dx = event.pageX - startOffset.left;
      var dy = event.pageY - startOffset.top;
      if (typeof option.drag === 'function')
        option.drag(dx, dy);
    }
    function endListener(event) {
      cancelEvent(event);
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
    cancelEvent(event);
    event = isTouchEnabled ? event.touches[0] : event;
    startOffset = {left: event.pageX, top: event.pageY};
    document.addEventListener(MOVE, moveListener, false);
    document.addEventListener(END, endListener, false);
  }

  function hasClass(el, className) {
    return el.classList.contains(className);
  }

  function addClass(el, className) {
    el.classList.add(className);
  }

  function removeClass(el, className) {
    el.classList.remove(className);
  }

  function indexOf(parentNode, childNode) {
    return Array.prototype.indexOf.call(parentNode.children, childNode);
  }

  function setCursor(value) {
    document.body.style.cursor = value;
  }

  function removeKeyboardFocus() {
    var activeElement = document.activeElement;
    if (activeElement && activeElement.blur)
      activeElement.blur();
  }

  function translate(el, x, y) {
    var value = 'translate(' + x + 'px, ' + y + 'px)';
    el.style.transform =  value;
    el.style.webkitTransform = value;
    el.style.MozTransform = value;
    el.style.msTransform = value;
    el.style.OTransform = value;
  }

  function requestAnimationFrame(callback) {
    return window.requestAnimationFrame(callback);
  }

  function supportsTouch() {
    return isTouchEnabled;
  }

  global.dom = {
    tappable: tappable,
    startTapEvent: startTapEvent,
    startDragEvent: startDragEvent,
    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    indexOf: indexOf,
    setCursor: setCursor,
    removeKeyboardFocus: removeKeyboardFocus,
    translate: translate,
    requestAnimationFrame: requestAnimationFrame,
    supportsTouch: supportsTouch
  };
})(this);