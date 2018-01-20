(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var ModulePort = jCore.Component.inherits(function(props) {
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
    this.plug = new ModulePort.Handle({ element: this.findElement('.module-port-plug') });
    this.socket = new ModulePort.Socket({ element: this.findElement('.module-port-socket') });
    this.socketHandle = new ModulePort.Handle({ element: this.findElement('.module-port-socket-handle') });
    this.content = new ModulePort.Content({ element: this.findElement('.module-port-content') });
  });

  ModulePort.prototype.hideButtonElement = function() {
    return this.findElement('.module-port-hide-button');
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
      dom.data(this.element(), 'type', type);
    });

    this.redrawBy('top', function(top) {
      dom.translateY(this.element(), top);
    });

    this.redrawBy('highlighted', function(highlighted) {
      dom.toggleClass(this.element(), 'highlighted', highlighted);

      // don't hide highlighted port
      dom.toggleClass(this.hideButtonElement(), 'disabled', highlighted);
    });

    this.redrawBy('isMoving', function(isMoving) {
      dom.toggleClass(this.element(), 'moving', isMoving);
    });
  };

  ModulePort.TYPE_PROP = 'prop';
  ModulePort.TYPE_EVENT = 'event';

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
    var Handle = jCore.Component.inherits(function() {
      this.visible = this.prop(true);
      this.highlighted = this.prop(false);
    });

    Handle.prototype.onredraw = function() {
      this.redrawBy('visible', function(visible) {
        dom.toggleClass(this.element(), 'hide', !visible);
      });

      this.redrawBy('highlighted', function(highlighted) {
        dom.toggleClass(this.element(), 'highlighted', highlighted);
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
        dom.text(this.element(), label);
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
