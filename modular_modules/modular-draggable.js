(function(window) {
  'use strict';

  var Draggable = function(props) {
    this.element = props.element;
    this.onstart = props.onstart;
    this.onmove = props.onmove;
    this.onend = props.onend;
    this.onmousedown = this.onmousedown.bind(this);
    this.onmousemove = this.onmousemove.bind(this);
    this.onmouseup = this.onmouseup.bind(this);
    this.ontouchstart = this.ontouchstart.bind(this);
    this.ontouchmove = this.ontouchmove.bind(this);
    this.ontouchend = this.ontouchend.bind(this);
    this.onscroll = Draggable.debounce(this.onscroll.bind(this), 0);
    this.identifier = null;
    this.startPageX = 0;
    this.startPageY = 0;
    this.startScrollX = 0;
    this.startScrollY = 0;
    this.dScrollX = 0;
    this.dScrollY = 0;
    this.context = null;
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

  Draggable.getOffset = function(element) {
    var rect = element.getBoundingClientRect();
    var bodyRect = document.body.getBoundingClientRect();
    var bodyStyle = window.getComputedStyle(document.body);
    var x = rect.left - element.scrollLeft - bodyRect.left + parseInt(bodyStyle.marginLeft, 10);
    var y = rect.top - element.scrollTop - bodyRect.top + parseInt(bodyStyle.marginTop, 10);
    return { x: x, y: y };
  };

  Draggable.getScrollOffset = function(element) {
    var x = 0;
    var y = 0;
    var el = element.parentNode;
    while (el) {
      x += el.scrollLeft || 0;
      y += el.scrollTop || 0;
      el = el.parentNode;
    }
    return { x: x, y: y };
  };

  Draggable.prototype.enable = function() {
    this.context = {};
    var type = (Draggable.supportsTouch() ? 'touchstart' : 'mousedown');
    this.element.addEventListener(type, this['on' + type], { passive: false });
  };

  Draggable.prototype.disable = function() {
    var supportsTouch = Draggable.supportsTouch();
    var startType = (supportsTouch ? 'touchstart' : 'mousedown');
    var moveType = (supportsTouch ? 'touchmove' : 'mousemove');
    var endType = (supportsTouch ? 'touchend' : 'mouseup');
    this.element.removeEventListener(startType, this['on' + startType], { passive: false });
    document.removeEventListener(moveType, this['on' + moveType]);
    document.removeEventListener(endType, this['on' + endType]);
    document.removeEventListener('scroll', this.onscroll, true);
    this.context = null;
  };

  Draggable.prototype.onmousedown = function(event) {
    var offset = Draggable.getOffset(event.target);
    var x = event.clientX - offset.x;
    var y = event.clientY - offset.y;
    this.startPageX = event.pageX;
    this.startPageY = event.pageY;
    var scrollOffset = Draggable.getScrollOffset(event.target);
    this.startScrollX = scrollOffset.x;
    this.startScrollY = scrollOffset.y;
    this.dScrollX = 0;
    this.dScrollY = 0;
    this.onstart.call(null, x, y, event, this.context);
    document.addEventListener('mousemove', this.onmousemove);
    document.addEventListener('mouseup', this.onmouseup);
    document.addEventListener('scroll', this.onscroll, true);
  };

  Draggable.prototype.onmousemove = function(event) {
    var dx = event.pageX - this.startPageX + this.dScrollX;
    var dy = event.pageY - this.startPageY + this.dScrollY;
    this.onmove.call(null, dx, dy, event, this.context);
  };

  Draggable.prototype.onmouseup = function(event) {
    document.removeEventListener('mousemove', this.onmousemove);
    document.removeEventListener('mouseup', this.onmouseup);
    document.removeEventListener('scroll', this.onscroll, true);
    var dx = event.pageX - this.startPageX + this.dScrollX;
    var dy = event.pageY - this.startPageY + this.dScrollY;
    this.onend.call(null, dx, dy, event, this.context);
  };

  Draggable.prototype.ontouchstart = function(event) {
    if (event.touches.length > 1) {
      return;
    }
    var touch = event.changedTouches[0];
    var offset = Draggable.getOffset(event.target);
    var x = touch.clientX - offset.x;
    var y = touch.clientY - offset.y;
    this.identifier = touch.identifier;
    this.startPageX = touch.pageX;
    this.startPageY = touch.pageY;
    var scrollOffset = Draggable.getScrollOffset(event.target);
    this.startScrollX = scrollOffset.x;
    this.startScrollY = scrollOffset.y;
    this.dScrollX = 0;
    this.dScrollY = 0;
    this.onstart.call(null, x, y, event, this.context);
    document.addEventListener('touchmove', this.ontouchmove);
    document.addEventListener('touchend', this.ontouchend);
    document.addEventListener('scroll', this.onscroll, true);
  };

  Draggable.prototype.ontouchmove = function(event) {
    var touch = event.changedTouches[0];
    if (touch.identifier !== this.identifier) {
      return;
    }
    var dx = touch.pageX - this.startPageX + this.dScrollX;
    var dy = touch.pageY - this.startPageY + this.dScrollY;
    this.onmove.call(null, dx, dy, event, this.context);
  };

  Draggable.prototype.ontouchend = function(event) {
    var touch = event.changedTouches[0];
    if (touch.identifier !== this.identifier) {
      return;
    }
    document.removeEventListener('touchmove', this.ontouchmove);
    document.removeEventListener('touchend', this.ontouchend);
    document.removeEventListener('scroll', this.onscroll, true);
    var dx = touch.pageX - this.startPageX + this.dScrollX;
    var dy = touch.pageY - this.startPageY + this.dScrollY;
    this.onend.call(null, dx, dy, event, this.context);
  };

  Draggable.prototype.onscroll = function() {
    var scrollOffset = Draggable.getScrollOffset(this.element);
    this.dScrollX = scrollOffset.x - this.startScrollX;
    this.dScrollY = scrollOffset.y - this.startScrollY;
  };

  Object.defineProperty(window.modular, 'Draggable', { value: Draggable });
})(this);
