(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var ModulePort = helper.inherits(function(props) {
    ModulePort.super_.call(this);

    this.label = this.prop(props.label);
    this.name = this.prop(props.name);
    this.type = this.prop(props.type);
    this.plugDisabled = this.prop(props.plugDisabled);
    this.socketDisabled = this.prop(props.socketDisabled);
    this.visible = this.prop(false);
    this.top = this.prop(0);
    this.height = this.prop(44);
    this.socketConnected = this.prop(false);
    this.labelHighlighted = this.prop(false);
    this.plugHighlighted = this.prop(false);
    this.socketHighlighted = this.prop(false);
    this.isMoving = this.prop(false);
    this.listItemElement = this.prop(this.renderListItem());
    this.parentListElement = this.prop(props.parentListElement);
    this.optionElement = this.prop(this.renderOption());
    this.parentOptGroupElement = this.prop(props.parentOptGroupElement);
    this.cache = this.prop({});

    // update the list-item element or the option element
    this.markDirty();
  }, jCore.Component);

  ModulePort.prototype.hideable = function() {
    // don't hide label-highlighted port
    return !this.labelHighlighted();
  };

  ModulePort.prototype.hideDisabled = function() {
    return !this.hideable();
  };

  ModulePort.prototype.bottom = function() {
    return this.top() + this.height();
  };

  ModulePort.prototype.renderListItem = function() {
    var element = dom.el('<div>');
    dom.addClass(element, 'module-port');
    dom.data(element, 'type', this.type());
    dom.html(element,
      (!this.plugDisabled() ? '<div class="module-port-plug"></div>' : '') +
      (!this.socketDisabled() ? '<div class="module-port-socket"><span></span></div>' : '') +
      '<div class="module-port-label">' + this.label() + '</div>' +
      '<img class="module-port-hide-button" src="images/minus-square-o.svg">'
    );
    return element;
  };

  ModulePort.prototype.renderOption = function() {
    var element = dom.el('<option>');
    dom.text(element, this.label());
    dom.value(element, this.name());
    return element;
  };

  ModulePort.prototype.redraw = function() {
    var cache = this.cache();

    var visible = this.visible();
    if (visible !== cache.visible) {
      if (visible) {
        dom.remove(this.optionElement());
        dom.append(this.parentListElement(), this.listItemElement());
      } else {
        dom.remove(this.listItemElement());
        dom.append(this.parentOptGroupElement(), this.optionElement());
      }
      cache.visible = visible;
    }

    var top = this.top();
    if (top !== cache.top) {
      var translate = 'translateY(' + top + 'px)';
      dom.css(this.listItemElement(), {
        transform: translate,
        webkitTransform: translate
      });
      cache.top = top;
    }

    var socketConnected = this.socketConnected();
    if (socketConnected !== cache.socketConnected) {
      dom.toggleClass(this.listItemElement(), 'module-port-socket-connected', socketConnected);
      cache.socketConnected = socketConnected;
    }

    var labelHighlighted = this.labelHighlighted();
    if (labelHighlighted !== cache.labelHighlighted) {
      dom.toggleClass(this.listItemElement(), 'module-port-label-highlight', labelHighlighted);
      cache.labelHighlighted = labelHighlighted;
    }

    var plugHighlighted = this.plugHighlighted();
    if (plugHighlighted !== cache.plugHighlighted) {
      dom.toggleClass(this.listItemElement(), 'module-port-plug-highlight', plugHighlighted);
      cache.plugHighlighted = plugHighlighted;
    }

    var socketHighlighted = this.socketHighlighted();
    if (socketHighlighted !== cache.socketHighlighted) {
      dom.toggleClass(this.listItemElement(), 'module-port-socket-highlight', socketHighlighted);
      cache.socketHighlighted = socketHighlighted;
    }

    var isMoving = this.isMoving();
    if (isMoving !== cache.isMoving) {
      dom.toggleClass(this.listItemElement(), 'module-port-moving', isMoving);
      cache.isMoving = isMoving;
    }

    var hideDisabled = this.hideDisabled();
    if (hideDisabled !== cache.hideDisabled) {
      dom.toggleClass(this.listItemElement(), 'module-port-hide-disabled', hideDisabled);
      cache.hideDisabled = hideDisabled;
    }
  };

  ModulePort.TYPE_PROP = 'prop';
  ModulePort.TYPE_EVENT = 'event';

  ModulePort.PLUG_OFFSET_X = 261;
  ModulePort.PLUG_WIDTH = 50;

  ModulePort.SOCKET_OFFSET_X = -25;
  ModulePort.SOCKET_WIDTH = 50;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModulePort;
  else
    app.ModulePort = ModulePort;
})(this.app || (this.app = {}));
