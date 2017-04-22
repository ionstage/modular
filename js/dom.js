(function(app) {
  'use strict';

  var helper = app.helper || require('./helper.js');

  var dom = {};

  dom.global = function() {
    return (typeof module !== 'undefined' && module.exports) ? global : window;
  };

  dom.el = function(selector) {
    if (selector.charAt(0) === '<') {
      selector = selector.match(/<(.+)>/)[1];
      return document.createElement(selector);
    }
    return document.querySelector(selector);
  };

  dom.svgEl = function(selector) {
    if (selector.charAt(0) === '<') {
      selector = selector.match(/<(.+)>/)[1];
      return document.createElementNS('http://www.w3.org/2000/svg', selector);
    }
    return dom.el(selector);
  };

  dom.body = function() {
    return document.body;
  };

  dom.append = function(parent, el) {
    parent.appendChild(el);
  };

  dom.remove = function(el) {
    var parentNode = el.parentNode;
    if (parentNode) {
      parentNode.removeChild(el);
    }
  };

  dom.child = function(el, index) {
    var len = arguments.length;
    if (len === 2) {
      return el.children[index];
    }
    for (var i = 1; i < len; i++) {
      index = arguments[i];
      el = el.children[index];
    }
    return el;
  };

  dom.childNode = function(el, index) {
    var len = arguments.length;
    if (len === 2) {
      return el.childNodes[index];
    }
    for (var i = 1; i < len; i++) {
      index = arguments[i];
      el = el.childNodes[index];
    }
    return el;
  };

  dom.children = function(el) {
    return Array.prototype.slice.call(el.children);
  };

  dom.parent = function(el) {
    return el.parentNode;
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

  dom.className = function(el, className) {
    dom.attr(el, { 'class': className });
  };

  dom.addClass = function(el, className) {
    el.classList.add(className);
  };

  dom.removeClass = function(el, className) {
    el.classList.remove(className);
  };

  dom.toggleClass = function(el, className, force) {
    if (typeof force === 'undefined') {
      el.classList.toggle(className);
      return;
    }
    if (force) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  };

  dom.hasClass = function(el, className) {
    return el.classList.contains(className);
  };

  dom.data = function(el, key, value) {
    if (typeof value === 'undefined') {
      return el.dataset[key];
    }
    if (value === null) {
      if (key in el.dataset) {
        delete el.dataset[key];
      }
      return;
    }
    el.dataset[key] = value;
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
    if (typeof s === 'undefined') {
      return el.value;
    }
    el.value = s;
  };

  dom.hasSelection = function(el) {
    return (el.selectionStart !== el.selectionEnd);
  };

  dom.selectAll = function(el) {
    el.setSelectionRange(0, 9999);
  };

  dom.disabled = function(el, disabled) {
    el.disabled = disabled;
  };

  dom.rect = function(el) {
    return el.getBoundingClientRect();
  };

  dom.offsetHeight = function(el) {
    return el.offsetHeight;
  };

  dom.scrollLeft = function(el) {
    return el.scrollLeft;
  };

  dom.scrollTop = function(el) {
    return el.scrollTop;
  };

  dom.scrollX = function() {
    return window.pageXOffset;
  };

  dom.scrollY = function() {
    return window.pageYOffset;
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

  dom.isFocused = function(el) {
    return (el === document.activeElement);
  };

  dom.removeFocus = function() {
    document.activeElement.blur();
  };

  dom.sort = function(el) {
    helper.sortBy(dom.children(el), 'textContent').forEach(function(child) {
      dom.append(el, child);
    });
  };

  dom.clone = function(el) {
    return el.cloneNode(true);
  };

  dom.translate = function(el, x, y) {
    var translate = 'translate(' + x + 'px, ' + y + 'px)';
    dom.css(el, {
      transform: translate,
      webkitTransform: translate,
    });
  };

  dom.translateY = function(el, y) {
    var translate = 'translateY(' + y + 'px)';
    dom.css(el, {
      transform: translate,
      webkitTransform: translate,
    });
  };

  dom.on = function(el, type, listener, useCapture) {
    el.addEventListener(type, listener, !!useCapture);
  };

  dom.off = function(el, type, listener, useCapture) {
    el.removeEventListener(type, listener, !!useCapture);
  };

  dom.ready = function(listener) {
    document.addEventListener('DOMContentLoaded', listener);
  };

  dom.transition = function(el, callback) {
    return new Promise(function(resolve, reject) {
      var ontransitionend = function() {
        dom.off(el, 'transitionend', ontransitionend);
        resolve();
      };
      dom.on(el, 'transitionend', ontransitionend);
      callback();
    });
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
      default:
        throw new Error('Invalid error type');
    }
  };

  dom.Point = (function() {
    var Point = function(props) {
      this.x = props.x;
      this.y = props.y;
    };

    Point.prototype.equal = function(other) {
      return (!!other && this.x === other.x && this.y === other.y);
    };

    return Point;
  })();

  dom.pagePoint = function(event, offset) {
    if (dom.supportsTouch()) {
      event = event.changedTouches[0];
    }
    return new dom.Point({
      x: event.pageX - (offset ? offset.x : 0),
      y: event.pageY - (offset ? offset.y : 0),
    });
  };

  dom.clientPoint = function(event, offset) {
    if (dom.supportsTouch()) {
      event = event.changedTouches[0];
    }
    return new dom.Point({
      x: event.clientX - (offset ? offset.x : 0),
      y: event.clientY - (offset ? offset.y : 0),
    });
  };

  dom.identifier = function(event) {
    if (dom.supportsTouch()) {
      return event.changedTouches[0].identifier;
    }
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
      this.context = {};

      dom.on(this.element, dom.eventType('start'), this.start);
    };

    Draggable.prototype.destroy = function() {
      dom.off(this.element, dom.eventType('start'), this.start);
      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);
      this.context = null;
    };

    var start = function(event) {
      if (this.lock) {
        return;
      }

      this.lock = true;
      this.identifier = dom.identifier(event);
      this.startingPoint = dom.pagePoint(event);

      var onstart = this.onstart;
      if (typeof onstart === 'function') {
        var element = this.element;
        var rect = dom.rect(element);
        var p = dom.clientPoint(event, {
          x: rect.left - dom.scrollLeft(element),
          y: rect.top - dom.scrollTop(element),
        });
        onstart(p.x, p.y, event, this.context);
      }

      dom.on(document, dom.eventType('move'), this.move);
      dom.on(document, dom.eventType('end'), this.end);
    };

    var move = function(event) {
      var identifier = this.identifier;

      if (identifier && identifier !== dom.identifier(event)) {
        return;
      }

      var onmove = this.onmove;
      if (typeof onmove === 'function') {
        var d = dom.pagePoint(event, this.startingPoint);
        onmove(d.x, d.y, event, this.context);
      }
    };

    var end = function(event) {
      var identifier = this.identifier;

      if (identifier && identifier !== dom.identifier(event)) {
        return;
      }

      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);

      var onend = this.onend;
      if (typeof onend === 'function') {
        var d = dom.pagePoint(event, this.startingPoint);
        onend(d.x, d.y, event, this.context);
      }

      this.lock = false;
    };

    return Draggable;
  })();

  dom.load = function(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();

      var onfailed = function() {
        reject(new Error('Failed to load file: ' + file.name));
      };

      reader.onload = function(event) {
        resolve(event.target.result);
      };

      reader.onerror = onfailed;
      reader.onabort = onfailed;

      reader.readAsText(file);
    });
  };

  dom.ajax = function(opt) {
    var type = opt.type;
    var url = opt.url;

    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();

      var onfailed = function() {
        reject(new Error('Failed to load resource: ' + type + ' ' + url));
      };

      req.onload = function() {
        if (req.status >= 200 && req.status < 400) {
          resolve(req.response);
        } else {
          onfailed();
        }
      };

      req.onerror = onfailed;
      req.onabort = onfailed;

      req.open(type, url, true);
      req.send();
    });
  };

  dom.location = function() {
    return document.location;
  };

  dom.urlOrigin = function(url) {
    return url.protocol + '//' + url.host;
  };

  dom.urlQuery = function(url) {
    return url.search.substring(1).split('&').reduce(function(prev, curr) {
      var items = curr.split('=');
      var key = items[0];
      if (key) {
        prev[decodeURIComponent(key)] = decodeURIComponent(items[1] || '');
      }
      return prev;
    }, {});
  };

  dom.Listenable = (function() {
    var Listenable = function(props) {
      this.callback = props.callback;
      this.resolve = null;
      this.reject = null;
      this.listener = Listenable.prototype.listener.bind(this);
    };

    Listenable.prototype.register = function(resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    };

    Listenable.prototype.unregister = function() {
      this.resolve = null;
      this.reject = null;
    };

    Listenable.prototype.listener = function(event) {
      try {
        this.callback(event);
        this.resolve();
      } catch (e) {
        this.reject(e);
      }
    };

    return Listenable;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = dom;
  } else {
    app.dom = dom;
  }
})(this.app || (this.app = {}));
