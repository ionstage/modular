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

    this.addRelation(new ModulePort.Relation({
      port: this,
      plug: new ModulePort.Handle({ element: this.childElement('plug') }),
      socket: new ModulePort.Socket({ element: this.childElement('socket') }),
      socketHandle: new ModulePort.Handle({ element: this.childElement('socketHandle') }),
      content: new ModulePort.Content({ element: this.childElement('content') }),
      hideButton: new ModulePort.HideButton({ element: this.childElement('hideButton') }),
    }));
  });

  ModulePort.prototype.childElement = (function() {
    var map = {
      plug: [0],
      socket: [1],
      socketHandle: [1, 0],
      content: [2],
      hideButton: [3],
    };
    return function(key) {
      return dom.child.apply(dom, [this.element()].concat(map[key]));
    };
  })();

  ModulePort.prototype.visible = function() {
    return (this.parentElement() !== null);
  };

  ModulePort.prototype.middle = function() {
    return this.top() + this.height() / 2;
  };

  ModulePort.prototype.bottom = function() {
    return this.top() + this.height();
  };

  ModulePort.prototype.elementContains = function(target) {
    return dom.contains(this.element(), target);
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
      this.plug = props.plug;
      this.socket = props.socket;
      this.socketHandle = props.socketHandle;
      this.content = props.content;
      this.hideButton = props.hideButton;
    }, jCore.Relation);

    Relation.prototype.update = function() {
      this.updatePlug();
      this.updateSocket();
      this.updateSocketHandle();
      this.updateContent();
      this.updateHideButton();
    };

    Relation.prototype.updatePlug = function() {
      this.plug.disabled(this.port.plugDisabled());
      this.plug.highlighted(this.port.plugHighlighted());
    };

    Relation.prototype.updateSocket = function() {
      this.socket.disabled(this.port.socketDisabled());
      this.socket.highlighted(this.port.socketHighlighted());
    };

    Relation.prototype.updateSocketHandle = function() {
      this.socketHandle.disabled(!this.port.socketConnected());
      this.socketHandle.highlighted(this.port.socketHighlighted());
    };

    Relation.prototype.updateContent = function() {
      this.content.label(this.port.label());
    };

    Relation.prototype.updateHideButton = function() {
      // don't hide highlighted port
      this.hideButton.disabled(this.port.highlighted());
    };

    return Relation;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePort;
  } else {
    app.ModulePort = ModulePort;
  }
})(this.app || (this.app = {}));
