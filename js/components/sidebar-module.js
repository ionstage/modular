(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var SidebarModule = jCore.Component.inherits(function(props) {
    this.title = this.prop(props.title);
    this.content = this.prop(props.content);
    this.name = this.prop(props.name);
    this.isActive = this.prop(false);
    this.draggable = new SidebarModule.Draggable(this);
  });

  SidebarModule.prototype.headerElement = function() {
    return this.findElement('.sidebar-module-header');
  };

  SidebarModule.prototype.contentElement = function() {
    return this.findElement('.sidebar-module-content');
  };

  SidebarModule.prototype.render = function() {
    return dom.render(SidebarModule.HTML_TEXT);
  };

  SidebarModule.prototype.onappend = function() {
    this.draggable.enable();
  };

  SidebarModule.prototype.onremove = function() {
    this.draggable.disable();
  };

  SidebarModule.prototype.onredraw = function() {
    this.redrawBy('isActive', function(isActive) {
      dom.toggleClass(this.element(), 'active', isActive);
    });

    this.redrawBy('title', function(title) {
      dom.text(this.headerElement(), title);
    });

    this.redrawBy('content', function(content) {
      dom.text(this.contentElement(), content);
    });
  };

  SidebarModule.HTML_TEXT = [
    '<div class="sidebar-module hoverable">',
      '<div class="sidebar-module-header sidebar-module-item"></div>',
      '<div class="sidebar-module-content sidebar-module-item"></div>',
    '</div>',
  ].join('');

  SidebarModule.Clone = (function() {
    var Clone = jCore.Component.inherits(function(props) {
      this.x = this.prop(props.x);
      this.y = this.prop(props.y);
    });

    Clone.prototype.oninit = function() {
      dom.addClass(this.element(), 'clone');
    };

    Clone.prototype.onredraw = function() {
      this.redrawBy('x', 'y', function(x, y) {
        dom.translate(this.element(), x, y);
      });
    };

    return Clone;
  })();

  SidebarModule.Draggable = (function() {
    var Draggable = jCore.Draggable.inherits();

    Draggable.prototype.onstart = function(module, x, y, event, context) {
      module.isActive(true);
      if (dom.supportsTouch()) {
        context.dragging = false;
        context.timer = setTimeout(this.ondragstart.bind(this), 300, module, x, y, event, context);
      } else {
        dom.cancel(event);
        this.ondragstart(module, x, y, event, context);
      }
    };

    Draggable.prototype.onmove = function(module, dx, dy, event, context) {
      if (context.dragging) {
        this.ondragmove(module, dx, dy, event, context);
      } else if (context.timer && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        module.isActive(false);
        clearTimeout(context.timer);
        context.timer = null;
      }
    };

    Draggable.prototype.onend = function(module, dx, dy, event, context) {
      module.isActive(false);
      if (context.dragging) {
        this.ondragend(module, dx, dy, event, context);
      } else if (context.timer) {
        clearTimeout(context.timer);
        context.timer = null;
      }
    };

    Draggable.prototype.ondragstart = function(module, x, y, event, context) {
      context.dragging = true;
      context.timer = null;
      context.x = dom.offsetLeft(module.element());
      context.y = dom.offsetTop(module.element());

      context.clone = new SidebarModule.Clone({
        element: dom.clone(module.element()),
        x: context.x,
        y: context.y,
      });

      context.clone.parentElement(dom.body());
      module.emit('dragstart');
    };

    Draggable.prototype.ondragmove = function(module, dx, dy, event, context) {
      context.clone.x(context.x + dx);
      context.clone.y(context.y + dy);
    };

    Draggable.prototype.ondragend = function(module, dx, dy, event, context) {
      context.dragging = false;
      context.clone.parentElement(null);
      module.emit('dragend');
      module.emit('drop', module.name(), context.x + dx, context.y + dy);
    };

    return Draggable;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarModule;
  } else {
    app.SidebarModule = SidebarModule;
  }
})(this.app || (this.app = {}));
