(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var ModulePort = Component.inherits(function(props) {
    this.listItem = new ModulePort.ListItem({
      element: this.renderListItem(),
      parentElement: props.parentListElement,
      visible: false,
      label: props.label,
      type: props.type,
      top: 0,
      highlighted: false,
      isMoving: false,
      plugDisabled: props.plugDisabled,
      plugHighlighted: false,
      socketDisabled: props.socketDisabled,
      socketHighlighted: false,
      socketConnected: false,
    });

    this.option = new ModulePort.Option({
      element: this.renderOption(),
      parentElement: props.parentOptGroupElement,
      visible: true,
      label: props.label,
      name: props.name,
    });
  });

  ModulePort.prototype.listItemElement = function() {
    return this.listItem.element();
  };

  ModulePort.prototype.visible = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
      this.option.visible(!value);
    }
    return this.listItem.visible(value);
  };

  ModulePort.prototype.label = function() {
    return this.listItem.label();
  };

  ModulePort.prototype.name = function() {
    return this.option.name();
  };

  ModulePort.prototype.type = function() {
    return this.listItem.type();
  };

  ModulePort.prototype.top = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.top(value);
  };

  ModulePort.prototype.highlighted = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.highlighted(value);
  };

  ModulePort.prototype.isMoving = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.isMoving(value);
  };

  ModulePort.prototype.plugDisabled = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.plugDisabled(value);
  };

  ModulePort.prototype.plugHighlighted = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.plugHighlighted(value);
  };

  ModulePort.prototype.socketDisabled = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.socketDisabled(value);
  };

  ModulePort.prototype.socketHighlighted = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.socketHighlighted(value);
  };

  ModulePort.prototype.socketConnected = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.socketConnected(value);
  };

  ModulePort.prototype.height = function() {
    return this.listItem.height();
  };

  ModulePort.prototype.middle = function() {
    return this.top() + this.height() / 2;
  };

  ModulePort.prototype.bottom = function() {
    return this.top() + this.height();
  };

  ModulePort.prototype.plugOffsetX = function() {
    return this.listItem.plugOffsetX();
  };

  ModulePort.prototype.socketOffsetX = function() {
    return this.listItem.socketOffsetX();
  };

  ModulePort.prototype.renderListItem = function() {
    return dom.render(ModulePort.LIST_ITEM_HTML_TEXT);
  };

  ModulePort.prototype.renderOption = function() {
    return dom.render(ModulePort.OPTION_HTML_TEXT);
  };

  ModulePort.prototype.redraw = function() {
    this.listItem.redraw();
    this.option.redraw();
  };

  ModulePort.TYPE_PROP = 'prop';
  ModulePort.TYPE_EVENT = 'event';

  ModulePort.PLUG_WIDTH = 50;
  ModulePort.SOCKET_WIDTH = 50;

  ModulePort.LIST_ITEM_HTML_TEXT = [
    '<div class="module-port">',
      '<div class="module-port-plug module-port-handle"></div>',
      '<div class="module-port-socket">',
        '<div class="module-port-socket-handle module-port-handle"></div>',
      '</div>',
      '<div class="module-port-label"></div>',
      '<img class="module-port-hide-button" src="images/minus-square-o.svg">',
    '</div>',
  ].join('');

  ModulePort.OPTION_HTML_TEXT = '<option></option>';

  ModulePort.ListItem = (function() {
    var ListItem = Component.inherits(function(props) {
      this.visible = this.prop(props.visible);
      this.label = this.prop(props.label);
      this.type = this.prop(props.type);
      this.top = this.prop(props.top);
      this.highlighted = this.prop(props.highlighted);
      this.isMoving = this.prop(props.isMoving);
      this.plugDisabled = this.prop(props.plugDisabled);
      this.plugHighlighted = this.prop(props.plugHighlighted);
      this.socketDisabled = this.prop(props.socketDisabled);
      this.socketHighlighted = this.prop(props.socketHighlighted);
      this.socketConnected = this.prop(props.socketConnected);
      this.height = this.prop(44);
      this.plugOffsetX = this.prop(261);
      this.socketOffsetX = this.prop(-25);
    });

    ListItem.prototype.plugElement = function() {
      return dom.child(this.element(), 0);
    };

    ListItem.prototype.socketElement = function() {
      return dom.child(this.element(), 1);
    };

    ListItem.prototype.socketHandleElement = function() {
      return dom.child(this.element(), 1, 0);
    };

    ListItem.prototype.labelElement = function() {
      return dom.child(this.element(), 2);
    };

    ListItem.prototype.hideButtonElement = function() {
      return dom.child(this.element(), 3);
    };

    ListItem.prototype.hideDisabled = function() {
      // don't hide highlighted port
      return this.highlighted();
    };

    ListItem.prototype.onredraw = function() {
      this.redrawVisibility();
      this.redrawLabel();
      this.redrawContent();
      this.redrawPlug();
      this.redrawSocket();
      this.redrawHideButton();
    };

    ListItem.prototype.redrawVisibility = function() {
      this.redrawProp('visible', function(visible) {
        if (visible) {
          dom.append(this.parentElement(), this.element());
        } else {
          dom.remove(this.element());
        }
      });
    };

    ListItem.prototype.redrawLabel = function() {
      this.redrawProp('label', function(label) {
        dom.text(this.labelElement(), label);
      });
    };

    ListItem.prototype.redrawContent = function() {
      this.redrawProp('type', function(type) {
        dom.data(this.element(), 'type', type);
      });

      this.redrawProp('top', function(top) {
        dom.translateY(this.element(), top);
      });

      this.redrawProp('highlighted', function(highlighted) {
        dom.toggleClass(this.element(), 'highlighted', highlighted);
      });

      this.redrawProp('isMoving', function(isMoving) {
        dom.toggleClass(this.element(), 'moving', isMoving);
      });
    };

    ListItem.prototype.redrawPlug = function() {
      this.redrawProp('plugDisabled', function(plugDisabled) {
        dom.toggleClass(this.plugElement(), 'hide', plugDisabled);
      });

      this.redrawProp('plugHighlighted', function(plugHighlighted) {
        dom.toggleClass(this.plugElement(), 'highlighted', plugHighlighted);
      });
    };

    ListItem.prototype.redrawSocket = function() {
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

    ListItem.prototype.redrawHideButton = function() {
      this.redrawProp('hideDisabled', function(hideDisabled) {
        dom.toggleClass(this.hideButtonElement(), 'disabled', hideDisabled);
      });
    };

    return ListItem;
  })();

  ModulePort.Option = (function() {
    var Option = Component.inherits(function(props) {
      this.visible = this.prop(props.visible);
      this.label = this.prop(props.label);
      this.name = this.prop(props.name);
    });

    Option.prototype.onredraw = function() {
      this.redrawVisibility();
      this.redrawLabel();
      this.redrawName();
    };

    Option.prototype.redrawVisibility = function() {
      this.redrawProp('visible', function(visible) {
        if (visible) {
          dom.append(this.parentElement(), this.element());
        } else {
          dom.remove(this.element());
        }
      });
    };

    Option.prototype.redrawLabel = function() {
      this.redrawProp('label', function(label) {
        dom.text(this.element(), label);
      });
    };

    Option.prototype.redrawName = function() {
      this.redrawProp('name', function(name) {
        dom.value(this.element(), name);
      });
    };

    return Option;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePort;
  } else {
    app.ModulePort = ModulePort;
  }
})(this.app || (this.app = {}));
