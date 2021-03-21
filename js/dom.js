(function(app) {
  'use strict';

  var dom = {};

  dom.export = function(key, value) {
    var g = (typeof global !== 'undefined' ? global : window);
    Object.defineProperty(g, key, { value: value });
  };

  dom.body = function() {
    return document.body;
  };

  dom.render = function(s) {
    var el = document.createRange().createContextualFragment(s).firstChild;
    el.parentNode.removeChild(el);
    return el;
  };

  dom.find = function(el, selectors) {
    return el.querySelector(selectors);
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
    el.dataset[key] = value;
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
    el.setSelectionRange(0, el.value.length);
  };

  dom.offsetLeft = function(el) {
    return el.getBoundingClientRect().left - el.scrollLeft - document.body.getBoundingClientRect().left;
  };

  dom.offsetTop = function(el) {
    return el.getBoundingClientRect().top - el.scrollTop - document.body.getBoundingClientRect().top;
  };

  dom.file = function(el) {
    return el.files[0];
  };

  dom.contentWindow = function(iframe) {
    return iframe.contentWindow;
  };

  dom.contentHeight = function(iframe) {
    return iframe.contentDocument.documentElement.scrollHeight;
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

  dom.once = function(el, type, listener, useCapture) {
    var wrapper = function() {
      dom.off(el, type, wrapper, useCapture);
      listener.apply(null, arguments);
    };
    dom.on(el, type, wrapper, useCapture);
  };

  dom.ready = function(listener) {
    document.addEventListener('DOMContentLoaded', listener, false);
  };

  dom.click = function(el) {
    el.click();
  };

  dom.supportsTouch = function() {
    return ('ontouchstart' in window || (typeof DocumentTouch !== 'undefined' && document instanceof DocumentTouch));
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

  dom.stop = function(event) {
    event.stopPropagation();
  };

  dom.eventType = function(name) {
    switch (name) {
      case 'start':
        return (dom.supportsTouch() ? 'touchstart' : 'mousedown');
      case 'move':
        return (dom.supportsTouch() ? 'touchmove' : 'mousemove');
      case 'end':
        return (dom.supportsTouch() ? 'touchend' : 'mouseup');
      default:
        throw new Error('Invalid event type');
    }
  };

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

  dom.urlQuery = function(loc, key) {
    var params = loc.search.substring(1).split('&');
    for (var i = 0, len = params.length; i < len; i++) {
      var items = params[i].split('=');
      if (decodeURIComponent(items[0] || '') === key) {
        return decodeURIComponent(items[1] || '');
      }
    }
    return null;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = dom;
  } else {
    app.dom = dom;
  }
})(this.app || (this.app = {}));
