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
    this.identifier = null;
    this.startPageX = 0;
    this.startPageY = 0;
    this.context = null;
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
    this.context = null;
  };

  Draggable.prototype.onmousedown = function(event) {
    var offset = Draggable.getOffset(event.target);
    var x = event.clientX - offset.x;
    var y = event.clientY - offset.y;
    this.startPageX = event.pageX;
    this.startPageY = event.pageY;
    this.onstart.call(null, x, y, event, this.context);
    document.addEventListener('mousemove', this.onmousemove);
    document.addEventListener('mouseup', this.onmouseup);
  };

  Draggable.prototype.onmousemove = function(event) {
    var dx = event.pageX - this.startPageX;
    var dy = event.pageY - this.startPageY;
    this.onmove.call(null, dx, dy, event, this.context);
  };

  Draggable.prototype.onmouseup = function(event) {
    document.removeEventListener('mousemove', this.onmousemove);
    document.removeEventListener('mouseup', this.onmouseup);
    var dx = event.pageX - this.startPageX;
    var dy = event.pageY - this.startPageY;
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
    this.onstart.call(null, x, y, event, this.context);
    document.addEventListener('touchmove', this.ontouchmove);
    document.addEventListener('touchend', this.ontouchend);
  };

  Draggable.prototype.ontouchmove = function(event) {
    var touch = event.changedTouches[0];
    if (touch.identifier !== this.identifier) {
      return;
    }
    var dx = touch.pageX - this.startPageX;
    var dy = touch.pageY - this.startPageY;
    this.onmove.call(null, dx, dy, event, this.context);
  };

  Draggable.prototype.ontouchend = function(event) {
    var touch = event.changedTouches[0];
    if (touch.identifier !== this.identifier) {
      return;
    }
    document.removeEventListener('touchmove', this.ontouchmove);
    document.removeEventListener('touchend', this.ontouchend);
    var dx = touch.pageX - this.startPageX;
    var dy = touch.pageY - this.startPageY;
    this.onend.call(null, dx, dy, event, this.context);
  };

  Object.defineProperty(window.modular, 'Draggable', { value: Draggable });
})(this);
