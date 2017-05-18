(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var ModulePort = Component.inherits(function(props) {
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
  });

  ModulePort.prototype.plugElement = function() {
    return dom.child(this.listItemElement(), 0);
  };

  ModulePort.prototype.socketElement = function() {
    return dom.child(this.listItemElement(), 1);
  };

  ModulePort.prototype.socketHandleElement = function() {
    return dom.child(this.listItemElement(), 1, 0);
  };

  ModulePort.prototype.labelElement = function() {
    return dom.child(this.listItemElement(), 2);
  };

  ModulePort.prototype.hideButtonElement = function() {
    return dom.child(this.listItemElement(), 3);
  };

  ModulePort.prototype.hideDisabled = function() {
    // don't hide label-highlighted port
    return this.labelHighlighted();
  };

  ModulePort.prototype.middle = function() {
    return this.top() + this.height() / 2;
  };

  ModulePort.prototype.bottom = function() {
    return this.top() + this.height();
  };

  ModulePort.prototype.renderListItem = function() {
    var element = dom.el('<div>');
    dom.addClass(element, 'module-port');
    dom.data(element, 'type', this.type());
    dom.html(element,
      '<div class="module-port-plug module-port-handle"></div>' +
      '<div class="module-port-socket"><div class="module-port-socket-handle module-port-handle"></div></div>' +
      '<div class="module-port-label"></div>' +
      '<img class="module-port-hide-button" src="images/minus-square-o.svg">'
    );
    return element;
  };

  ModulePort.prototype.renderOption = function() {
    return dom.el('<option>');
  };

  ModulePort.prototype.redraw = function() {
    this.redrawVisibility();
    this.redrawLabel();
    this.redrawName();
    this.redrawListItem();
    this.redrawPlug();
    this.redrawSocket();
    this.redrawHideButton();
  };

  ModulePort.prototype.redrawVisibility = function() {
    this.redrawProp('visible', function(visible) {
      if (visible) {
        dom.remove(this.optionElement());
        dom.append(this.parentListElement(), this.listItemElement());
      } else {
        dom.remove(this.listItemElement());
        dom.append(this.parentOptGroupElement(), this.optionElement());
      }
    });
  };

  ModulePort.prototype.redrawLabel = function() {
    this.redrawProp('label', function(label) {
      dom.text(this.labelElement(), label);
      dom.text(this.optionElement(), label);
    });
  };

  ModulePort.prototype.redrawName = function() {
    this.redrawProp('name', function(name) {
      dom.value(this.optionElement(), name);
    });
  };

  ModulePort.prototype.redrawListItem = function() {
    this.redrawProp('top', function(top) {
      dom.translateY(this.listItemElement(), top);
    });

    this.redrawProp('labelHighlighted', function(labelHighlighted) {
      dom.toggleClass(this.listItemElement(), 'label-highlighted', labelHighlighted);
    });

    this.redrawProp('isMoving', function(isMoving) {
      dom.toggleClass(this.listItemElement(), 'moving', isMoving);
    });
  };

  ModulePort.prototype.redrawPlug = function() {
    this.redrawProp('plugDisabled', function(plugDisabled) {
      dom.toggleClass(this.plugElement(), 'hide', plugDisabled);
    });

    this.redrawProp('plugHighlighted', function(plugHighlighted) {
      dom.toggleClass(this.plugElement(), 'highlighted', plugHighlighted);
    });
  };

  ModulePort.prototype.redrawSocket = function() {
    this.redrawProp('socketDisabled', function(socketDisabled) {
      dom.toggleClass(this.socketElement(), 'hide', socketDisabled);
    });

    this.redrawProp('socketHighlighted', function(socketHighlighted) {
      dom.toggleClass(this.socketElement(), 'highlighted', socketHighlighted);
      dom.toggleClass(this.socketHandleElement(), 'highlighted', socketHighlighted);
    });

    this.redrawProp('socketConnected', function(socketConnected) {
      dom.toggleClass(this.socketHandleElement(), 'hide', !socketConnected);
    });
  };

  ModulePort.prototype.redrawHideButton = function() {
    this.redrawProp('hideDisabled', function(hideDisabled) {
      dom.toggleClass(this.hideButtonElement(), 'disabled', hideDisabled);
    });
  };

  ModulePort.TYPE_PROP = 'prop';
  ModulePort.TYPE_EVENT = 'event';

  ModulePort.PLUG_OFFSET_X = 261;
  ModulePort.PLUG_WIDTH = 50;

  ModulePort.SOCKET_OFFSET_X = -25;
  ModulePort.SOCKET_WIDTH = 50;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePort;
  } else {
    app.ModulePort = ModulePort;
  }
})(this.app || (this.app = {}));
