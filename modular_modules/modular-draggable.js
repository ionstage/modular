(function(window) {
  'use strict';

  var Draggable = function(el) {
    this.el = el;
    this.onstart = null;
    this.onmove = null;
    this.onend = null;
    this.onmousedown = this.onmousedown.bind(this);
    this.onmousemove = this.onmousemove.bind(this);
    this.onmouseup = this.onmouseup.bind(this);
    this.ontouchstart = this.ontouchstart.bind(this);
    this.ontouchmove = this.ontouchmove.bind(this);
    this.ontouchend = this.ontouchend.bind(this);
    this.pointers = {};
  };

  Draggable.IDENTIFIER_MOUSE = 0;

  Draggable.Pointer = function(identifier, pageX, pageY, scroll, onscroll) {
    this.identifier = identifier;
    this.startPageX = pageX;
    this.startPageY = pageY;
    this.startScrollX = scroll.x;
    this.startScrollY = scroll.y;
    this.startScrollWidth = scroll.width;
    this.startScrollHeight = scroll.height;
    this.dScrollX = 0;
    this.dScrollY = 0;
    this.context = {};
    this.onscroll = onscroll;
  };

  Draggable.debounce = function(func, delay) {
    var t = 0;
    var ctx = null;
    var args = null;
    return function() {
      ctx = this;
      args = arguments;
      if (t) {
        clearTimeout(t);
      }
      t = setTimeout(function() {
        func.apply(ctx, args);
        t = 0;
        ctx = null;
        args = null;
      }, delay);
    };
  };

  Draggable.supportsTouch = function() {
    return 'ontouchstart' in window || (typeof DocumentTouch !== 'undefined' && document instanceof DocumentTouch);
  };

  Draggable.getOffset = function(el) {
    var rect = el.getBoundingClientRect();
    var bodyRect = document.body.getBoundingClientRect();
    var bodyStyle = window.getComputedStyle(document.body);
    var x = rect.left - el.scrollLeft - bodyRect.left + parseInt(bodyStyle.marginLeft, 10);
    var y = rect.top - el.scrollTop - bodyRect.top + parseInt(bodyStyle.marginTop, 10);
    return { x: x, y: y };
  };

  Draggable.getScrollOffset = function(el) {
    var x = 0;
    var y = 0;
    var width = 0;
    var height = 0;
    el = el.parentNode;
    while (el) {
      x += el.scrollLeft || 0;
      y += el.scrollTop || 0;
      width += (el.scrollWidth - el.clientWidth) || 0;
      height += (el.scrollHeight - el.clientHeight) || 0;
      el = el.parentNode;
    }
    return {
      x: x,
      y: y,
      width: width,
      height: height,
    };
  };

  Draggable.prototype.createPointer = function(identifier, event) {
    var scroll = Draggable.getScrollOffset(event.target);
    var onscroll = Draggable.debounce(this.onscroll.bind(this, identifier), 0);
    return new Draggable.Pointer(identifier, event.pageX, event.pageY, scroll, onscroll);
  };

  Draggable.prototype.addPointer = function(p) {
    document.addEventListener('scroll', p.onscroll, true);
    this.pointers[String(p.identifier)] = p;
  };

  Draggable.prototype.removePointer = function(p) {
    document.removeEventListener('scroll', p.onscroll, true);
    p.context = null;
    p.onscroll = null;
    delete this.pointers[String(p.identifier)];
  };

  Draggable.prototype.removeAllPointers = function() {
    Object.keys(this.pointers).forEach(function(id) {
      this.removePointer(this.pointers[id]);
    }, this);
  };

  Draggable.prototype.hasPointer = function() {
    return (Object.keys(this.pointers).length !== 0);
  };

  Draggable.prototype.findPointer = function(identifier) {
    return this.pointers[String(identifier)] || null;
  };

  Draggable.prototype.resolveUnhandledTouches = function(event) {
    var ids = Object.keys(this.pointers);
    if (ids.length === 0) {
      return;
    }
    ids.forEach(function(id) {
      var p = this.pointers[id];
      for (var i = 0, len = event.touches.length; i < len; i++) {
        if (event.touches[i].identifier === p.identifier) {
          return;
        }
      }
      // pointer is unhandled
      var dx = event.pageX - p.startPageX + p.dScrollX;
      var dy = event.pageY - p.startPageY + p.dScrollY;
      this.onend.call(null, dx, dy, event, p.context);
      this.removePointer(p);
    }, this);
  };

  Draggable.prototype.enable = function(listeners) {
    this.onstart = listeners.onstart;
    this.onmove = listeners.onmove;
    this.onend = listeners.onend;
    var type = (Draggable.supportsTouch() ? 'touchstart' : 'mousedown');
    this.el.addEventListener(type, this['on' + type], { passive: false });
  };

  Draggable.prototype.disable = function() {
    var supportsTouch = Draggable.supportsTouch();
    var startType = (supportsTouch ? 'touchstart' : 'mousedown');
    var moveType = (supportsTouch ? 'touchmove' : 'mousemove');
    var endType = (supportsTouch ? 'touchend' : 'mouseup');
    this.el.removeEventListener(startType, this['on' + startType], { passive: false });
    document.removeEventListener(moveType, this['on' + moveType]);
    document.removeEventListener(endType, this['on' + endType]);
    this.removeAllPointers();
  };

  Draggable.prototype.onmousedown = function(event) {
    var offset = Draggable.getOffset(event.target);
    var x = event.clientX - offset.x;
    var y = event.clientY - offset.y;
    var p = this.createPointer(Draggable.IDENTIFIER_MOUSE, event);
    this.addPointer(p);
    this.onstart.call(null, x, y, event, p.context);
    document.addEventListener('mousemove', this.onmousemove);
    document.addEventListener('mouseup', this.onmouseup);
  };

  Draggable.prototype.onmousemove = function(event) {
    var p = this.findPointer(Draggable.IDENTIFIER_MOUSE);
    var dx = event.pageX - p.startPageX + p.dScrollX;
    var dy = event.pageY - p.startPageY + p.dScrollY;
    this.onmove.call(null, dx, dy, event, p.context);
  };

  Draggable.prototype.onmouseup = function(event) {
    var p = this.findPointer(Draggable.IDENTIFIER_MOUSE);
    var dx = event.pageX - p.startPageX + p.dScrollX;
    var dy = event.pageY - p.startPageY + p.dScrollY;
    document.removeEventListener('mousemove', this.onmousemove);
    document.removeEventListener('mouseup', this.onmouseup);
    this.onend.call(null, dx, dy, event, p.context);
    this.removePointer(p);
  };

  Draggable.prototype.ontouchstart = function(event) {
    this.resolveUnhandledTouches(event);
    var hasPointer = this.hasPointer();
    var touches = event.changedTouches;
    for (var i = 0, len = touches.length; i < len; i++) {
      var touch = touches[i];
      var offset = Draggable.getOffset(touch.target);
      var x = touch.clientX - offset.x;
      var y = touch.clientY - offset.y;
      var p = this.createPointer(touch.identifier, touch);
      this.addPointer(p);
      this.onstart.call(null, x, y, event, p.context);
    }
    if (!hasPointer) {
      // first touch
      document.addEventListener('touchmove', this.ontouchmove);
      document.addEventListener('touchend', this.ontouchend);
    }
  };

  Draggable.prototype.ontouchmove = function(event) {
    var touches = event.changedTouches;
    for (var i = 0, len = touches.length; i < len; i++) {
      var touch = touches[i];
      var p = this.findPointer(touch.identifier);
      if (p === null) {
        continue;
      }
      var dx = touch.pageX - p.startPageX + p.dScrollX;
      var dy = touch.pageY - p.startPageY + p.dScrollY;
      this.onmove.call(null, dx, dy, event, p.context);
    }
  };

  Draggable.prototype.ontouchend = function(event) {
    var touches = event.changedTouches;
    for (var i = 0, len = touches.length; i < len; i++) {
      var touch = touches[i];
      var p = this.findPointer(touch.identifier);
      if (p === null) {
        continue;
      }
      var dx = touch.pageX - p.startPageX + p.dScrollX;
      var dy = touch.pageY - p.startPageY + p.dScrollY;
      this.onend.call(null, dx, dy, event, p.context);
      this.removePointer(p);
    }
    if (!this.hasPointer()) {
      // last touch
      document.removeEventListener('touchmove', this.ontouchmove);
      document.removeEventListener('touchend', this.ontouchend);
    }
  };

  Draggable.prototype.onscroll = function(identifier) {
    var p = this.findPointer(identifier);
    if (p === null) {
      return;
    }
    var scrollOffset = Draggable.getScrollOffset(this.el);
    var dScrollWidth = scrollOffset.width - p.startScrollWidth;
    var dScrollHeight = scrollOffset.height - p.startScrollHeight;
    p.dScrollX = scrollOffset.x - p.startScrollX - dScrollWidth;
    p.dScrollY = scrollOffset.y - p.startScrollY - dScrollHeight;
  };

  Object.defineProperty(window.modular, 'Draggable', { value: Draggable });
})(this);
