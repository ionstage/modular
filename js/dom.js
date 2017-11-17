(function(app) {
  'use strict';

  var dom = {};

  dom.export = function(key, value) {
    var g = (typeof global !== 'undefined' ? global : window);
    Object.defineProperty(g, key, { value: value });
  };

  dom.find = function(el, selector) {
    return el.querySelector(selector);
  };

  dom.body = function() {
    return document.body;
  };

  dom.render = function(s) {
    var el = document.createRange().createContextualFragment(s).firstChild;
    dom.remove(el);
    return el;
  };

  dom.append = function(parent, el) {
    parent.appendChild(el);
  };

  dom.remove = function(el) {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  };

  dom.childNode = function() {
    return Array.prototype.slice.call(arguments).reduce(function(el, index) {
      return ('childNodes' in el ? el.childNodes[index] : null);
    });
  };

  dom.parent = function(el) {
    return el.parentNode;
  };

  dom.contains = function(el, other) {
    return el.contains(other);
  };

  dom.attr = function(el, props) {
    Object.keys(props).forEach(function(key) {
      el.setAttribute(key, props[key]);
    });
  };

  dom.css = function(el, props) {
    var style = el.style;
    Object.keys(props).forEach(function(key) {
      style[key] = props[key];
    });
  };

  dom.className = function(el, className) {
    dom.attr(el, { 'class': className });
  };

  dom.addClass = function(el, className) {
    el.classList.add(className);
  };

  dom.toggleClass = function(el, className, force) {
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
    el.dataset[key] = value;
  };

  dom.name = function(el, s) {
    el.name = s;
  };

  dom.text = function(el, s) {
    el.textContent = s;
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

  dom.rect = function(el) {
    return el.getBoundingClientRect();
  };

  dom.scrollLeft = function(el) {
    return el.scrollLeft;
  };

  dom.scrollTop = function(el) {
    return el.scrollTop;
  };

  dom.offsetLeft = function(el) {
    return dom.rect(el).left - dom.scrollLeft(el) - dom.rect(dom.body()).left;
  };

  dom.offsetTop = function(el) {
    return dom.rect(el).top - dom.scrollTop(el) - dom.rect(dom.body()).top;
  };

  dom.file = function(el) {
    return el.files[0];
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

  dom.clone = function(el) {
    return el.cloneNode(true);
  };

  dom.transform = function(el, value) {
    dom.css(el, {
      transform: value,
      webkitTransform: value,
    });
  };

  dom.translate = function(el, x, y) {
    dom.transform(el, 'translate(' + x + 'px, ' + y + 'px)');
  };

  dom.translateY = function(el, y) {
    dom.transform(el, 'translateY(' + y + 'px)');
  };

  dom.on = function(el, type, listener, useCapture) {
    el.addEventListener(type, listener, !!useCapture);
  };

  dom.off = function(el, type, listener, useCapture) {
    el.removeEventListener(type, listener, !!useCapture);
  };

  dom.ready = function(listener) {
    document.addEventListener('DOMContentLoaded', listener, false);
  };

  dom.click = function(el) {
    el.click();
  };

  dom.supportsTouch = function() {
    return ('createTouch' in document);
  };

  dom.changedTouch = function(event) {
    return (dom.supportsTouch() && 'changedTouches' in event ? event.changedTouches[0] : null);
  };

  dom.target = function(event) {
    var touch = dom.changedTouch(event);
    return (touch ? document.elementFromPoint(touch.clientX, touch.clientY) : event.target);
  };

  dom.cancel = function(event) {
    event.preventDefault();
  };

  dom.origin = function(event) {
    return event.origin;
  };

  dom.messageData = function(event) {
    return event.data;
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
        throw new Error('Invalid event type');
    }
  };

  dom.pageX = function(event) {
    return (dom.changedTouch(event) || event).pageX;
  };

  dom.pageY = function(event) {
    return (dom.changedTouch(event) || event).pageY;
  };

  dom.clientX = function(event) {
    return (dom.changedTouch(event) || event).clientX;
  };

  dom.clientY = function(event) {
    return (dom.changedTouch(event) || event).clientY;
  };

  dom.identifier = function(event) {
    var touch = dom.changedTouch(event);
    return (touch ? touch.identifier : null);
  };

  dom.Draggable = (function() {
    var Draggable = function(props) {
      this.element = props.element;
      this.start = this.start.bind(this);
      this.move = this.move.bind(this);
      this.end = this.end.bind(this);
      this.onstart = null;
      this.onmove = null;
      this.onend = null;
      this.lock = false;
      this.identifier = null;
      this.startPageX = 0;
      this.startPageY = 0;
      this.context = {};
    };

    Draggable.prototype.enable = function(listeners) {
      this.onstart = listeners.onstart;
      this.onmove = listeners.onmove;
      this.onend = listeners.onend;
      dom.on(this.element, dom.eventType('start'), this.start);
    };

    Draggable.prototype.disable = function() {
      dom.off(this.element, dom.eventType('start'), this.start);
      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);
      this.lock = false;
      this.context = {};
    };

    Draggable.prototype.start = function(event) {
      if (this.lock) {
        return;
      }

      this.lock = true;
      this.identifier = dom.identifier(event);
      this.startPageX = dom.pageX(event);
      this.startPageY = dom.pageY(event);

      var x = dom.clientX(event) - dom.offsetLeft(this.element);
      var y = dom.clientY(event) - dom.offsetTop(this.element);
      this.onstart.call(null, x, y, event, this.context);

      dom.on(document, dom.eventType('move'), this.move);
      dom.on(document, dom.eventType('end'), this.end);
    };

    Draggable.prototype.move = function(event) {
      if (this.identifier && this.identifier !== dom.identifier(event)) {
        return;
      }

      var dx = dom.pageX(event) - this.startPageX;
      var dy = dom.pageY(event) - this.startPageY;
      this.onmove.call(null, dx, dy, event, this.context);
    };

    Draggable.prototype.end = function(event) {
      if (this.identifier && this.identifier !== dom.identifier(event)) {
        return;
      }

      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);

      var dx = dom.pageX(event) - this.startPageX;
      var dy = dom.pageY(event) - this.startPageY;
      this.onend.call(null, dx, dy, event, this.context);

      this.lock = false;
    };

    return Draggable;
  })();

  dom.readFile = function(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();

      var onfailed = function() {
        reject(new Error('Failed to read file: ' + file.name));
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

  dom.loadJSON = function(url) {
    return dom.ajax({
      type: 'GET',
      url: url,
    }).then(function(text) {
      return JSON.parse(text);
    });
  };

  dom.location = function() {
    return document.location;
  };

  dom.urlOrigin = function(url) {
    return url.protocol + '//' + url.host;
  };

  dom.urlQuery = function(url) {
    return url.search.substring(1).split('&').reduce(function(obj, param) {
      var items = param.split('=');
      var key = items[0];
      if (key) {
        obj[decodeURIComponent(key)] = decodeURIComponent(items[1] || '');
      }
      return obj;
    }, {});
  };

  dom.Listenable = (function() {
    var Listenable = function(props) {
      this.element = props.element;
      this.type = props.type;
      this.callback = props.callback;
      this.resolve = props.resolve;
      this.reject = props.reject;
      this.listener = Listenable.prototype.listener.bind(this);

      dom.on(this.element, this.type, this.listener);
    };

    Listenable.prototype.destroy = function() {
      dom.off(this.element, this.type, this.listener);
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
