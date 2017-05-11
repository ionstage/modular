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

    // update list-item in redrawToggleClass() method
    this.element = this.listItemElement;
  });

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
    var plugClassName = 'module-port-plug' + (this.plugDisabled() ? ' hide' : '');
    var socketClassName = 'module-port-socket' + (this.socketDisabled() ? ' hide' : '');
    dom.html(element,
      '<div class="' + plugClassName + '"></div>' +
      '<div class="' + socketClassName + '"><span></span></div>' +
      '<div class="module-port-label"></div>' +
      '<img class="module-port-hide-button" src="images/minus-square-o.svg">'
    );
    dom.text(dom.child(element, 2), this.label());
    return element;
  };

  ModulePort.prototype.renderOption = function() {
    var element = dom.el('<option>');
    dom.text(element, this.label());
    dom.value(element, this.name());
    return element;
  };

  ModulePort.prototype.redraw = function() {
    this.redrawVisibility();
    this.redrawPosition();
    this.redrawToggleClasses();
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

  ModulePort.prototype.redrawPosition = function() {
    this.redrawProp('top', function(top) {
      dom.translateY(this.listItemElement(), top);
    });
  };

  ModulePort.prototype.redrawToggleClasses = function() {
    this.redrawToggleClass('socketConnected', 'socket-connected');
    this.redrawToggleClass('labelHighlighted', 'label-highlighted');
    this.redrawToggleClass('plugHighlighted', 'plug-highlighted');
    this.redrawToggleClass('socketHighlighted', 'socket-highlighted');
    this.redrawToggleClass('isMoving', 'moving');
    this.redrawToggleClass('hideDisabled', 'hide-disabled');
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
