(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var ModulePort = Component.inherits(function(props) {
    this.label = this.prop(props.label);
    this.name = this.prop(props.name);
    this.type = this.prop(props.type);
    this.plugDisabled = this.prop(props.plugDisabled);
    this.socketDisabled = this.prop(props.socketDisabled);
    this.top = this.prop(0);
    this.highlighted = this.prop(false);
    this.plugHighlighted = this.prop(false);
    this.socketHighlighted = this.prop(false);
    this.socketConnected = this.prop(false);
    this.isMoving = this.prop(false);
    this.height = this.prop(44);
    this.plugOffsetX = this.prop(261);
    this.socketOffsetX = this.prop(-25);
    this.parentListElement = this.prop(props.parentListElement);

    this.plug = new ModulePort.Handle();
    this.socket = new ModulePort.Socket();
    this.socketHandle = new ModulePort.Handle();
    this.content = new ModulePort.Content();
    this.hideButton = new ModulePort.HideButton();

    this.addRelation(new ModulePort.Relation({ port: this }));
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
    var Handle = Component.inherits(function() {
      this.disabled = this.prop(false);
      this.highlighted = this.prop(false);
    });

    Handle.prototype.onredraw = function() {
      this.redrawDOMToggleClassBy('disabled', 'hide');
      this.redrawDOMToggleClassBy('highlighted', 'highlighted');
    };

    return Handle;
  })();

  // socket has the same properties as handle
  ModulePort.Socket = ModulePort.Handle.inherits();

  ModulePort.Content = (function() {
    var Content = Component.inherits(function() {
      this.label = this.prop('');
    });

    Content.prototype.onredraw = function() {
      this.redrawDOMTextBy('label');
    };

    return Content;
  })();

  ModulePort.HideButton = (function() {
    var HideButton = Component.inherits(function() {
      this.disabled = this.prop(false);
    });

    HideButton.prototype.onredraw = function() {
      this.redrawDOMToggleClassBy('disabled', 'disabled');
    };

    return HideButton;
  })();

  ModulePort.Relation = (function() {
    var Relation = helper.inherits(function(props) {
      this.port = props.port;
    }, jCore.Relation);

    Relation.prototype.update = function() {
      var port = this.port;

      port.plug.disabled(port.plugDisabled());
      port.plug.highlighted(port.plugHighlighted());
      port.socket.disabled(port.socketDisabled());
      port.socket.highlighted(port.socketHighlighted());
      port.socketHandle.disabled(!port.socketConnected());
      port.socketHandle.highlighted(port.socketHighlighted());
      port.content.label(port.label());

      // don't hide highlighted port
      port.hideButton.disabled(port.highlighted());
    };

    return Relation;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePort;
  } else {
    app.ModulePort = ModulePort;
  }
})(this.app || (this.app = {}));
