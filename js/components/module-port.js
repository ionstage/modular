(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var ModulePort = Component.inherits(function(props) {
    this.name = this.prop(props.name);
    this.type = this.prop(props.type);
    this.top = this.prop(0);
    this.highlighted = this.prop(false);
    this.isMoving = this.prop(false);
    this.height = this.prop(44);
    this.plugOffsetX = this.prop(261);
    this.socketOffsetX = this.prop(-25);
    this.parentListElement = this.prop(props.parentListElement);

    this.plug = new ModulePort.Handle({ disabled: props.plugDisabled });
    this.socket = new ModulePort.Socket({ disabled: props.socketDisabled });
    this.socketHandle = new ModulePort.Handle({ disabled: true });
    this.content = new ModulePort.Content({ label: props.label });
    this.hideButton = new ModulePort.HideButton();
  });

  ModulePort.prototype.childElement = (function() {
    var map = {
      plug: [0],
      socket: [1],
      socketHandle: [1, 0],
      content: [2],
      hideButton: [3],
    };
    return function(child) {
      var key = helper.find(Object.keys(map), function(key) {
        return (this[key] === child);
      }.bind(this));
      return dom.child.apply(dom, [this.element()].concat(map[key]));
    };
  })();

  ModulePort.prototype.visible = function(value) {
    if (typeof value !== 'undefined') {
      this.parentElement(value ? this.parentListElement() : null);
    }
    return (this.parentElement() !== null);
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
    return this.plug.highlighted(value);
  };

  ModulePort.prototype.socketHighlighted = function(value) {
    this.socketHandle.highlighted(value);
    return this.socket.highlighted(value);
  };

  ModulePort.prototype.socketConnected = function(value) {
    if (typeof value !== 'undefined') {
      this.markDirty();
      this.socketHandle.disabled(!value);
    }
    return !this.socketHandle.disabled();
  };

  ModulePort.prototype.hideDisabled = function(value) {
    return this.hideButton.disabled(value);
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

  ModulePort.prototype.appendChild = function(child) {
    child.element(this.childElement(child));
    child.parentElement(dom.parent(child.element()));
    child.clearCache();
    child.redraw();
  };

  ModulePort.prototype.onappend = function() {
    this.appendChild(this.plug);
    this.appendChild(this.socket);
    this.appendChild(this.socketHandle);
    this.appendChild(this.content);
    this.appendChild(this.hideButton);
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

  ModulePort.HTML_TEXT = [
    '<div class="module-port">',
      '<div class="module-port-plug module-port-handle"></div>',
      '<div class="module-port-socket">',
        '<div class="module-port-socket-handle module-port-handle"></div>',
      '</div>',
      '<div class="module-port-content"></div>',
      '<img class="module-port-hide-button" src="images/minus-square-o.svg">',
    '</div>',
  ].join('');

  ModulePort.Handle = (function() {
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

  // socket has the same properties as handle
  ModulePort.Socket = ModulePort.Handle.inherits();

  ModulePort.Content = (function() {
    var Content = Component.inherits(function(props) {
      this.label = this.prop(props.label);
    });

    Content.prototype.redraw = function() {
      this.redrawDOMTextBy('label');
    };

    return Content;
  })();

  ModulePort.HideButton = (function() {
    var HideButton = Component.inherits(function() {
      this.disabled = this.prop(false);
    });

    HideButton.prototype.redraw = function() {
      this.redrawDOMToggleClassBy('disabled', 'disabled');
    };

    return HideButton;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePort;
  } else {
    app.ModulePort = ModulePort;
  }
})(this.app || (this.app = {}));
