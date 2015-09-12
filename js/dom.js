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

  var pointerEvent = (function() {
    var isInitialized = false;
    var lock = false;
    var optionMap = {};
    var noop = function() {};
    var previousTarget;
    var currentTarget;
    var currentOptions;
    var startOffset;
    var isDragStarted;
    var holdTimerId = null;

    var extend = function(a, b) {
      for (var key in b) {
        a[key] = b[key];
      }
      return a;
    };

    var getTarget = function(event) {
      if (isTouchEnabled) {
        var touch = event.changedTouches[0];
        return document.elementFromPoint(touch.clientX, touch.clientY);
      } else {
        return event.target;
      }
    };

    var getCurrentOptions = function(optionMap, target) {
      var options = [];

      var optionListById = optionMap['#' + target.id];
      if (Array.isArray(optionListById))
        options = options.concat(optionListById);

      var classList = target.classList;
      for (var i = 0, len = classList.length; i < len; i++) {
        var className = classList[i];
        var optionListByClassName = optionMap['.' + className];
        if (Array.isArray(optionListByClassName))
          options = options.concat(optionListByClassName);
      }

      return options;
    };

    var getStartOffset = function(event) {
      event = isTouchEnabled ? event.changedTouches[0] : event;
      return {
        x: event.pageX,
        y: event.pageY
      };
    };

    var getOffset = function(event, startOffset) {
      event = isTouchEnabled ? event.changedTouches[0] : event;
      return {
        x: event.pageX - startOffset.x,
        y: event.pageY - startOffset.y
      };
    };

    var holdTimer = function() {
      holdTimerId = null;
      currentOptions.forEach(function(option) {
        option.onhold();
      });
    };

    var start = function(event) {
      if (lock)
        return;

      lock = true;
      currentTarget = previousTarget = getTarget(event);
      currentOptions = getCurrentOptions(optionMap, currentTarget);
      startOffset = getStartOffset(event);
      isDragStarted = false;
      holdTimerId = setTimeout(holdTimer, 300);

      document.addEventListener(MOVE, move);
      document.addEventListener(END, end);

      currentOptions.forEach(function(option) {
        option.onstart(event);
      });
    };

    var move = function(event) {
      var target = getTarget(event);
      var offset = getOffset(event, startOffset);

      if (holdTimerId !== null && (Math.abs(offset.x) > 5 || Math.abs(offset.y) > 5)) {
        clearTimeout(holdTimerId);
        holdTimerId = null;
      }

      currentOptions.forEach(function(option) {
        if (!isDragStarted)
          option.ondragstart(event);

        option.ondrag(event, offset.x, offset.y);

        if (target !== previousTarget) {
          if (previousTarget === currentTarget)
            option.onout(event);
          else if (target === currentTarget)
            option.onover(event);
        }
      });

      previousTarget = target;

      if (!isDragStarted)
        isDragStarted = true;
    };

    var end = function(event) {
      document.removeEventListener(MOVE, move);
      document.removeEventListener(END, end);

      var target = getTarget(event);
      var offset = getOffset(event, startOffset);

      currentOptions.forEach(function(option) {
        if (isDragStarted)
          option.ondragend(event, offset.x, offset.y);

        option.onend(event);

        if (target === currentTarget)
          option.ontap(event);
      });

      if (holdTimerId !== null) {
        clearTimeout(holdTimerId);
        holdTimerId = null;
      }

      lock = false;
    };

    return function(selector, option) {
      if (!isInitialized) {
        document.addEventListener(START, start);
        isInitialized = true;
      }

      var options = optionMap[selector];

      if (!options)
        options = optionMap[selector] = [];

      options.push(extend({
        onstart: noop,
        onhold: noop,
        ondragstart: noop,
        ondrag: noop,
        onout: noop,
        onover: noop,
        ondragend: noop,
        onend: noop,
        ontap: noop
      }, option));
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
    pointerEvent: pointerEvent,
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