(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var ModulePort = jCore.Component.inherits(function(_, props) {
    this.label = this.prop(props.label);
    this.name = this.prop(props.name);
    this.type = this.prop(props.type);
    this.plugDisabled = this.prop(props.plugDisabled);
    this.socketDisabled = this.prop(props.socketDisabled);
    this.offsetX = this.prop(props.offsetX);
    this.offsetY = this.prop(props.offsetY);
    this.top = this.prop(0);
    this.highlightCount = this.prop(0);
    this.isMoving = this.prop(false);
    this.height = this.prop(44);
    this.plugOffsetX = this.prop(261);
    this.plugWidth = this.prop(50);
    this.socketOffsetX = this.prop(-25);
    this.socketWidth = this.prop(50);
    this.member = props.member;
    this.module = props.module;
    this.plug = new ModulePort.Handle(dom.find(this.el, '.module-port-plug'));
    this.socket = new ModulePort.Socket(dom.find(this.el, '.module-port-socket'));
    this.socketHandle = new ModulePort.Handle(dom.find(this.el, '.module-port-socket-handle'));
    this.content = new ModulePort.Content(dom.find(this.el, '.module-port-content'));
  });

  ModulePort.prototype.hideButtonElement = function() {
    return dom.find(this.el, '.module-port-hide-button');
  };

  ModulePort.prototype.visible = function() {
    return (this.parentElement() !== null);
  };

  ModulePort.prototype.middle = function() {
    return this.top() + this.height() / 2;
  };

  ModulePort.prototype.bottom = function() {
    return this.top() + this.height();
  };

  ModulePort.prototype.plugX = function() {
    return this.offsetX() + this.plugOffsetX();
  };

  ModulePort.prototype.plugY = function() {
    return this.offsetY() + this.middle();
  };

  ModulePort.prototype.socketX = function() {
    return this.offsetX() + this.socketOffsetX();
  };

  ModulePort.prototype.socketY = function() {
    return this.offsetY() + this.middle();
  };

  ModulePort.prototype.highlighted = function() {
    return (this.highlightCount() !== 0);
  };

  ModulePort.prototype.plugHighlighted = function(value) {
    return this.plug.highlighted(value);
  };

  ModulePort.prototype.socketHighlighted = function(value) {
    this.socketHandle.highlighted(value);
    return this.socket.highlighted(value);
  };

  ModulePort.prototype.socketConnected = function(value) {
    return this.socketHandle.visible(value);
  };

  ModulePort.prototype.incrementHighlightCount = function() {
    this.highlightCount(this.highlightCount() + 1);
    if (this.highlightCount() === 1) {
      this.emit('highlight', this);
    }
  };

  ModulePort.prototype.decrementHighlightCount = function() {
    this.highlightCount(this.highlightCount() - 1);
    if (this.highlightCount() === 0) {
      this.emit('unhighlight', this);
    }
  };

  ModulePort.prototype.render = function() {
    return dom.render(ModulePort.HTML_TEXT);
  };

  ModulePort.prototype.oninit = function() {
    this.plug.visible(!this.plugDisabled());
    this.socket.visible(!this.socketDisabled());
    this.socketHandle.visible(false);
    this.content.label(this.label());
  };

  ModulePort.prototype.onredraw = function() {
    this.redrawBy('type', function(type) {
      dom.data(this.el, 'type', type);
    });

    this.redrawBy('top', function(top) {
      dom.translateY(this.el, top);
    });

    this.redrawBy('highlighted', function(highlighted) {
      dom.toggleClass(this.el, 'highlighted', highlighted);

      // don't hide highlighted port
      dom.toggleClass(this.hideButtonElement(), 'disabled', highlighted);
    });

    this.redrawBy('isMoving', function(isMoving) {
      dom.toggleClass(this.el, 'moving', isMoving);
    });
  };

  ModulePort.TYPE_DATA = 'data';
  ModulePort.TYPE_EVENT = 'event';

  ModulePort.HTML_TEXT = [
    '<div class="module-port">',
      '<div class="module-port-plug module-port-handle"></div>',
      '<div class="module-port-socket">',
        '<div class="module-port-socket-handle module-port-handle"></div>',
      '</div>',
      '<div class="module-port-content"></div>',
      '<div class="module-port-hide-button"><svg class="module-port-hide-button-content" width="100%" height="100%" viewBox="-896 -896 3584 3584"><path d="M1344 800v64q0 14-9 23t-23 9h-832q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h832q14 0 23 9t9 23zm128 448v-832q0-66-47-113t-113-47h-832q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113zm128-832v832q0 119-84.5 203.5t-203.5 84.5h-832q-119 0-203.5-84.5t-84.5-203.5v-832q0-119 84.5-203.5t203.5-84.5h832q119 0 203.5 84.5t84.5 203.5z" fill="#212121"/></svg></div>',
    '</div>',
  ].join('');

  ModulePort.Handle = (function() {
    var Handle = jCore.Component.inherits(function() {
      this.visible = this.prop(true);
      this.highlighted = this.prop(false);
    });

    Handle.prototype.onredraw = function() {
      this.redrawBy('visible', function(visible) {
        dom.toggleClass(this.el, 'hide', !visible);
      });

      this.redrawBy('highlighted', function(highlighted) {
        dom.toggleClass(this.el, 'highlighted', highlighted);
      });
    };

    return Handle;
  })();

  // socket has the same properties as handle
  ModulePort.Socket = ModulePort.Handle.inherits();

  ModulePort.Content = (function() {
    var Content = jCore.Component.inherits(function() {
      this.label = this.prop('');
    });

    Content.prototype.onredraw = function() {
      this.redrawBy('label', function(label) {
        dom.text(this.el, label);
      });
    };

    return Content;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModulePort;
  } else {
    app.ModulePort = ModulePort;
  }
})(this.app || (this.app = {}));
