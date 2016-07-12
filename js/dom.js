(function(app) {
  'use strict';

  var dom = {};

  dom.unsupported = function() {
    return (typeof document === 'undefined');
  };

  dom.el = function(selector) {
    if (selector.charAt(0) === '<') {
      selector = selector.match(/<(.+)>/)[1];
      return document.createElement(selector);
    }
  };

  dom.append = function(parent, el) {
    parent.appendChild(el);
  };

  dom.remove = function(el) {
    var parentNode = el.parentNode;
    if (parentNode)
      parentNode.removeChild(el);
  };

  dom.child = function(el, index) {
    var len = arguments.length;

    if (len === 2)
      return el.children[index];

    for (var i = 1; i < len; i++) {
      index = arguments[i];
      el = el.children[index];
    }

    return el;
  };

  dom.childNode = function(el, index) {
    var len = arguments.length;

    if (len === 2)
      return el.childNodes[index];

    for (var i = 1; i < len; i++) {
      index = arguments[i];
      el = el.childNodes[index];
    }

    return el;
  };

  dom.children = function(el) {
    return Array.prototype.slice.call(el.children);
  };

  dom.contains = function(el, other) {
    return el.contains(other);
  };

  dom.attr = function(el, props) {
    for (var key in props) {
      el.setAttribute(key, props[key]);
    }
  };

  dom.css = function(el, props) {
    var style = el.style;

    for (var key in props) {
      style[key] = props[key];
    }
  };

  dom.addClass = function(el, className) {
    el.classList.add(className);
  };

  dom.removeClass = function(el, className) {
    el.classList.remove(className);
  };

  dom.hasClass = function(el, className) {
    return el.classList.contains(className);
  };

  dom.name = function(el, s) {
    el.name = s;
  };

  dom.text = function(el, s) {
    el.textContent = s;
  };

  dom.html = function(el, s) {
    el.innerHTML = s;
  };

  dom.value = function(el, s) {
    if (typeof s === 'undefined')
      return el.value;

    el.value = s;
  };

  dom.rect = function(el) {
    return el.getBoundingClientRect();
  };

  dom.scrollLeft = function(el) {
    return el.scrollLeft;
  };

  dom.scrollTop = function(el) {
    return el.scrollTop;
  };

  dom.contentWindow = function(iframe) {
    return iframe.contentWindow;
  };

  dom.writeContent = function(iframe, s) {
    var doc = iframe.contentDocument;
    doc.open();
    doc.write(s);
    doc.close();
  };

  dom.fillContentHeight = function(iframe) {
    iframe.style.height = iframe.contentDocument.documentElement.scrollHeight + 'px';
  };

  dom.removeFocus = function() {
    document.activeElement.blur();
  };

  dom.animate = function(callback) {
    return window.requestAnimationFrame(callback);
  };

  dom.on = function(el, type, listener, useCapture) {
    el.addEventListener(type, listener, !!useCapture);
  };

  dom.off = function(el, type, listener, useCapture) {
    el.removeEventListener(type, listener, !!useCapture);
  };

  dom.supportsTouch = function() {
    return 'createTouch' in document;
  };

  dom.target = function(event) {
    if (dom.supportsTouch() && 'changedTouches' in event) {
      event = event.changedTouches[0];
      return document.elementFromPoint(event.clientX, event.clientY);
    }

    return event.target;
  };

  dom.cancel = function(event) {
    event.preventDefault();
  };

  dom.eventType = function(name) {
    var supportsTouch = dom.supportsTouch();

    switch (name) {
    case 'start':
      return (supportsTouch ? 'touchstart' : 'mousedown');
    case 'move':
      return (supportsTouch ? 'touchmove' : 'mousemove');
    case 'end':
      return (supportsTouch ? 'touchend' : 'mouseup');
    }
  };

  dom.pagePoint = function(event, offset) {
    if (dom.supportsTouch())
      event = event.changedTouches[0];

    return {
      x: event.pageX - (offset ? offset.x : 0),
      y: event.pageY - (offset ? offset.y : 0)
    };
  };

  dom.clientPoint = function(event, offset) {
    if (dom.supportsTouch())
      event = event.changedTouches[0];

    return {
      x: event.clientX - (offset ? offset.x : 0),
      y: event.clientY - (offset ? offset.y : 0)
    };
  };

  dom.identifier = function(event) {
    if (dom.supportsTouch())
      return event.changedTouches[0].identifier;

    return null;
  };

  dom.Draggable = (function() {
    var Draggable = function(props) {
      this.element = props.element;
      this.onstart = props.onstart;
      this.onmove = props.onmove;
      this.onend = props.onend;
      this.start = start.bind(this);
      this.move = move.bind(this);
      this.end = end.bind(this);
      this.lock = false;
      this.identifier = null;
      this.startingPoint = null;

      dom.on(this.element, dom.eventType('start'), this.start);
    };

    Draggable.prototype.destroy = function() {
      dom.off(this.element, dom.eventType('start'), this.start);
      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);
    };

    var start = function(event) {
      if (this.lock)
        return;

      this.lock = true;
      this.identifier = dom.identifier(event);
      this.startingPoint = dom.pagePoint(event);

      var element = this.element;
      var onstart = this.onstart;

      var rect = dom.rect(element);
      var p = dom.clientPoint(event, {
        x: rect.left - dom.scrollLeft(element),
        y: rect.top - dom.scrollTop(element)
      });

      if (typeof onstart === 'function')
        onstart(p.x, p.y, event);

      dom.on(document, dom.eventType('move'), this.move);
      dom.on(document, dom.eventType('end'), this.end);
    };

    var move = function(event) {
      var identifier = this.identifier;

      if (identifier && identifier !== dom.identifier(event))
        return;

      var onmove = this.onmove;
      var d = dom.pagePoint(event, this.startingPoint);

      if (typeof onmove === 'function')
        onmove(d.x, d.y, event);
    };

    var end = function(event) {
      var identifier = this.identifier;

      if (identifier && identifier !== dom.identifier(event))
        return;

      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);

      var onend = this.onend;
      var d = dom.pagePoint(event, this.startingPoint);

      if (typeof onend === 'function')
        onend(d.x, d.y, event);

      this.lock = false;
    };

    return Draggable;
  })();

  dom.ajax = function(opt) {
    var type = opt.type;
    var url = opt.url;

    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();

      var onfailed = function() {
        reject(new Error('Failed to load resource: ' + type + ' ' + url));
      };

      req.onload = function() {
        if (req.status >= 200 && req.status < 400)
          resolve(req.responseText);
        else
          onfailed();
      };

      req.onerror = onfailed;
      req.onabort = onfailed;

      req.open(type, url, true);
      req.send();
    });
  };

  dom.origin = function() {
    return location.protocol + '//' + location.host;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = dom;
  else
    app.dom = dom;
})(this.app || (this.app = {}));

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

      var hasHoldEvent = currentOptions.some(function(option) {
        return option.onhold !== noop;
      });

      if (hasHoldEvent)
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