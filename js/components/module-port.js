(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var ModulePort = Component.inherits(function(props) {
    this.parentListElement = this.prop(props.parentListElement);
    this.parentOptGroupElement = this.prop(props.parentOptGroupElement);

    this.listItem = new ModulePort.ListItem({
      label: props.label,
      type: props.type,
      plugDisabled: props.plugDisabled,
      socketDisabled: props.socketDisabled,
    });

    this.option = new ModulePort.Option({
      parentElement: props.parentOptGroupElement,
      label: props.label,
      name: props.name,
    });
  });

  ModulePort.prototype.visible = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
      this.listItem.parentElement(value ? this.parentListElement() : null);
      this.option.parentElement(value ? null : this.parentOptGroupElement());
    }
    return (this.listItem.parentElement() !== null);
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

      // don't hide highlighted port
      this.listItem.hideDisabled(value);
    }
    return this.listItem.highlighted(value);
  };

  ModulePort.prototype.isMoving = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.isMoving(value);
  };

  ModulePort.prototype.plugDisabled = function() {
    return this.listItem.plugDisabled();
  };

  ModulePort.prototype.plugHighlighted = function(value) {
    if (!this.visible()) {
      return false;
    }
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.listItem.plugHighlighted(value);
  };

  ModulePort.prototype.socketDisabled = function() {
    return this.listItem.socketDisabled();
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

  ModulePort.prototype.elementContains = function(element) {
    var listItemElement = this.listItem.element();
    return (listItemElement ? dom.contains(listItemElement, element) : false);
  };

  ModulePort.prototype.redraw = function() {
    this.listItem.redraw();
    this.option.redraw();
  };

  ModulePort.TYPE_PROP = 'prop';
  ModulePort.TYPE_EVENT = 'event';

  ModulePort.PLUG_WIDTH = 50;
  ModulePort.SOCKET_WIDTH = 50;

  ModulePort.ListItem = (function() {
    var ListItem = Component.inherits(function(props) {
      this.type = this.prop(props.type);
      this.top = this.prop(0);
      this.highlighted = this.prop(false);
      this.isMoving = this.prop(false);
      this.height = this.prop(44);
      this.plugOffsetX = this.prop(261);
      this.socketOffsetX = this.prop(-25);

      this.plug = new ListItem.Handle({ disabled: props.plugDisabled });
      this.socket = new ListItem.Socket({ disabled: props.socketDisabled });
      this.content = new ListItem.Content({ label: props.label });
      this.hideButton = new ListItem.HideButton();
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

    ListItem.prototype.plugDisabled = function(value) {
      return this.plug.disabled(value);
    };

    ListItem.prototype.plugHighlighted = function(value) {
      return this.plug.highlighted(value);
    };

    ListItem.prototype.socketDisabled = function(value) {
      return this.socket.disabled(value);
    };

    ListItem.prototype.socketHighlighted = function(value) {
      return this.socket.highlighted(value);
    };

    ListItem.prototype.socketConnected = function(value) {
      return this.socket.connected(value);
    };

    ListItem.prototype.label = function(value) {
      return this.content.label(value);
    };

    ListItem.prototype.hideDisabled = function(value) {
      return this.hideButton.disabled(value);
    };

    ListItem.prototype.render = function() {
      return dom.render(ListItem.HTML_TEXT);
    };

    ListItem.prototype.onappend = function() {
      this.plug.element(this.plugElement());
      this.plug.parentElement(this.element());
      this.plug.redraw();

      this.socket.element(this.socketElement());
      this.socket.parentElement(this.element());
      this.socket.redraw();
      this.socket.appendHandle(this.socketHandleElement());

      this.content.element(this.labelElement());
      this.content.parentElement(this.element());
      this.content.redraw();

      this.hideButton.element(this.hideButtonElement());
      this.hideButton.parentElement(this.element());
      this.hideButton.redraw();
    };

    ListItem.prototype.onremove = function() {
      this.plug.clearCache();
      this.socket.clearCache();
      this.content.clearCache();
      this.hideButton.clearCache();
    };

    ListItem.prototype.onredraw = function() {
      this.redrawType();
      this.redrawPosition();
      this.redrawDOMToggleClasses();
    };

    ListItem.prototype.redrawType = function() {
      this.redrawDOMDataBy('type', 'type');
    };

    ListItem.prototype.redrawPosition = function() {
      this.redrawBy('top', function(top) {
        dom.translateY(this.element(), top);
      });
    };

    ListItem.prototype.redrawDOMToggleClasses = function() {
      this.redrawDOMToggleClassBy('highlighted', 'highlighted');
      this.redrawDOMToggleClassBy('isMoving', 'moving');
    };

    ListItem.HTML_TEXT = [
      '<div class="module-port">',
        '<div class="module-port-plug module-port-handle"></div>',
        '<div class="module-port-socket">',
          '<div class="module-port-socket-handle module-port-handle"></div>',
        '</div>',
        '<div class="module-port-content"></div>',
        '<img class="module-port-hide-button" src="images/minus-square-o.svg">',
      '</div>',
    ].join('');

    ListItem.Handle = (function() {
      var Handle = Component.inherits(function(props) {
        this.disabled = this.prop(props.disabled);
        this.highlighted = this.prop(false);
      });

      Handle.prototype.redraw = function() {
        this.redrawDOMToggleClassBy('disabled', 'hide');
        this.redrawDOMToggleClassBy('highlighted', 'highlighted');
      };

      return Handle;
    })();

    ListItem.Socket = (function() {
      var Socket = Component.inherits(function(props) {
        this.disabled = this.prop(props.disabled);
        this.handle = new ListItem.Handle({ disabled: true });
      });

      Socket.prototype.highlighted = function(value) {
        if (typeof value !== 'undefined') {
          this.markDirty();
        }
        return this.handle.highlighted(value);
      };

      Socket.prototype.connected = function(value) {
        if (typeof value === 'undefined') {
          return !this.handle.disabled();
        }
        this.handle.disabled(!value);
      };

      Socket.prototype.appendHandle = function(element) {
        this.handle.element(element);
        this.handle.parentElement(this.element());
        this.handle.clearCache();
        this.handle.redraw();
      };

      Socket.prototype.redraw = function() {
        this.redrawDOMToggleClassBy('disabled', 'hide');
        this.redrawDOMToggleClassBy('highlighted', 'highlighted');
      };

      return Socket;
    })();

    ListItem.Content = (function() {
      var Content = Component.inherits(function(props) {
        this.label = this.prop(props.label);
      });

      Content.prototype.redraw = function() {
        this.redrawDOMTextBy('label');
      };

      return Content;
    })();

    ListItem.HideButton = (function() {
      var HideButton = Component.inherits(function() {
        this.disabled = this.prop(false);
      });

      HideButton.prototype.redraw = function() {
        this.redrawDOMToggleClassBy('disabled', 'disabled');
      };

      return HideButton;
    })();

    return ListItem;
  })();

  ModulePort.Option = (function() {
    var Option = Component.inherits(function(props) {
      this.label = this.prop(props.label);
      this.name = this.prop(props.name);
    });

    Option.prototype.render = function() {
      return dom.render(Option.HTML_TEXT);
    };

    Option.prototype.onredraw = function() {
      this.redrawDOMTextBy('label');
      this.redrawDOMValueBy('name');
    };

    Option.HTML_TEXT = '<option></option>';

    return Option;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePort;
  } else {
    app.ModulePort = ModulePort;
  }
})(this.app || (this.app = {}));
