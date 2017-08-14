(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var ModulePort = Component.inherits(function(props) {
    this.name = this.prop(props.name);
    this.type = this.prop(props.type);
    this.top = this.prop(0);
    this.isMoving = this.prop(false);
    this.height = this.prop(44);
    this.plugOffsetX = this.prop(261);
    this.socketOffsetX = this.prop(-25);
    this.parentListElement = this.prop(props.parentListElement);

    this.plug = new ModulePort.Plug({ disabled: props.plugDisabled });
    this.socket = new ModulePort.Socket({ disabled: props.socketDisabled });
    this.content = new ModulePort.Content({ label: props.label });
    this.hideButton = new ModulePort.HideButton();

    this.children = [this.plug, this.socket, this.content, this.hideButton];
  });

  ModulePort.prototype.visible = function(value) {
    if (typeof value !== 'undefined') {
      this.parentElement(value ? this.parentListElement() : null);
    }
    return (this.parentElement() !== null);
  };

  ModulePort.prototype.highlighted = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    // don't hide highlighted port
    return this.hideButton.disabled(value);
  };

  ModulePort.prototype.plugDisabled = function() {
    return this.plug.disabled();
  };

  ModulePort.prototype.socketDisabled = function() {
    return this.socket.disabled();
  };

  ModulePort.prototype.label = function() {
    return this.content.label();
  };

  ModulePort.prototype.plugHighlighted = function(value) {
    if (!this.visible()) {
      return false;
    }
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.plug.highlighted(value);
  };

  ModulePort.prototype.socketHighlighted = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.socket.highlighted(value);
  };

  ModulePort.prototype.socketConnected = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
    }
    return this.socket.connected(value);
  };

  ModulePort.prototype.middle = function() {
    return this.top() + this.height() / 2;
  };

  ModulePort.prototype.bottom = function() {
    return this.top() + this.height();
  };

  ModulePort.prototype.elementContains = function(target) {
    var element = this.element();
    return (element ? dom.contains(element, target) : false);
  };

  ModulePort.prototype.render = function() {
    return dom.render(ModulePort.HTML_TEXT);
  };

  ModulePort.prototype.onredraw = function() {
    this.redrawDOMDataBy('type', 'type');
    this.redrawDOMTranslateYBy('top');
    this.redrawDOMToggleClassBy('highlighted', 'highlighted');
    this.redrawDOMToggleClassBy('isMoving', 'moving');
  };

  ModulePort.TYPE_PROP = 'prop';
  ModulePort.TYPE_EVENT = 'event';

  ModulePort.PLUG_WIDTH = 50;
  ModulePort.SOCKET_WIDTH = 50;

  ModulePort.HTML_TEXT = '<div class="module-port"></div>';

  ModulePort.Handle = (function() {
    var Handle = Component.inherits(function(props) {
      this.disabled = this.prop(props.disabled);
      this.highlighted = this.prop(false);
    });

    Handle.prototype.onredraw = function() {
      this.redrawDOMToggleClassBy('disabled', 'hide');
      this.redrawDOMToggleClassBy('highlighted', 'highlighted');
    };

    return Handle;
  })();

  ModulePort.Plug = (function() {
    var Plug = ModulePort.Handle.inherits();

    Plug.prototype.render = function() {
      return dom.render(Plug.HTML_TEXT);
    };

    Plug.HTML_TEXT = '<div class="module-port-plug module-port-handle"></div>';

    return Plug;
  })();

  ModulePort.Socket = (function() {
    var Socket = Component.inherits(function(props) {
      this.disabled = this.prop(props.disabled);
      this.handle = new ModulePort.SocketHandle({ disabled: true });
      this.children = [this.handle];
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

    Socket.prototype.render = function() {
      return dom.render(Socket.HTML_TEXT);
    };

    Socket.prototype.onredraw = function() {
      this.redrawDOMToggleClassBy('disabled', 'hide');
      this.redrawDOMToggleClassBy('highlighted', 'highlighted');
    };

    Socket.HTML_TEXT = '<div class="module-port-socket"></div>';

    return Socket;
  })();

  ModulePort.SocketHandle = (function() {
    var SocketHandle = ModulePort.Handle.inherits();

    SocketHandle.prototype.render = function() {
      return dom.render(SocketHandle.HTML_TEXT);
    };

    SocketHandle.HTML_TEXT = '<div class="module-port-socket-handle module-port-handle"></div>';

    return SocketHandle;
  })();

  ModulePort.Content = (function() {
    var Content = Component.inherits(function(props) {
      this.label = this.prop(props.label);
    });

    Content.prototype.render = function() {
      return dom.render(Content.HTML_TEXT);
    };

    Content.prototype.onredraw = function() {
      this.redrawDOMTextBy('label');
    };

    Content.HTML_TEXT = '<div class="module-port-content"></div>';

    return Content;
  })();

  ModulePort.HideButton = (function() {
    var HideButton = Component.inherits(function() {
      this.disabled = this.prop(false);
    });

    HideButton.prototype.render = function() {
      return dom.render(HideButton.HTML_TEXT);
    };

    HideButton.prototype.onredraw = function() {
      this.redrawDOMToggleClassBy('disabled', 'disabled');
    };

    HideButton.HTML_TEXT = '<img class="module-port-hide-button" src="images/minus-square-o.svg">';

    return HideButton;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePort;
  } else {
    app.ModulePort = ModulePort;
  }
})(this.app || (this.app = {}));
