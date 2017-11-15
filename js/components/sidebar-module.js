(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var SidebarModule = Component.inherits(function(props) {
    this.title = this.prop(props.title);
    this.content = this.prop(props.content);
    this.name = this.prop(props.name);
    this.isActive = this.prop(false);

    this.draggable = null;
  });

  SidebarModule.prototype.headerElement = function() {
    return this.childElement('.sidebar-module-header');
  };

  SidebarModule.prototype.contentElement = function() {
    return this.childElement('.sidebar-module-content');
  };

  SidebarModule.prototype.registerDragListener = function() {
    this.draggable = new dom.Draggable({
      element: this.element(),
      onstart: SidebarModule.prototype.onstart.bind(this),
      onmove: SidebarModule.prototype.onmove.bind(this),
      onend: SidebarModule.prototype.onend.bind(this),
    });
  };

  SidebarModule.prototype.unregisterDragListener = function() {
    this.draggable.destroy();
    this.draggable = null;
  };

  SidebarModule.prototype.render = function() {
    return dom.render(SidebarModule.HTML_TEXT);
  };

  SidebarModule.prototype.renderClone = function() {
    var element = dom.clone(this.element());
    dom.addClass(element, 'clone');
    return element;
  };

  SidebarModule.prototype.redrawTitle = function() {
    this.redrawBy('title', function(title) {
      dom.text(this.headerElement(), title);
    });
  };

  SidebarModule.prototype.redrawContent = function() {
    this.redrawBy('content', function(content) {
      dom.text(this.contentElement(), content);
    });
  };

  SidebarModule.prototype.onappend = function() {
    this.registerDragListener();
  };

  SidebarModule.prototype.onremove = function() {
    this.unregisterDragListener();
  };

  SidebarModule.prototype.onredraw = function() {
    this.redrawBy('isActive', function(isActive) {
      dom.toggleClass(this.element(), 'active', isActive);
    });

    this.redrawTitle();
    this.redrawContent();
  };

  SidebarModule.prototype.onstart = function(x, y, event, context) {
    this.isActive(true);
    if (dom.supportsTouch()) {
      context.dragging = false;
      context.timer = setTimeout(this.ondragstart.bind(this), 300, x, y, event, context);
    } else {
      dom.cancel(event);
      this.ondragstart(x, y, event, context);
    }
  };

  SidebarModule.prototype.onmove = function(dx, dy, event, context) {
    if (context.dragging) {
      this.ondragmove(dx, dy, event, context);
    } else if (context.timer && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      this.isActive(false);
      clearTimeout(context.timer);
      context.timer = null;
    }
  };

  SidebarModule.prototype.onend = function(dx, dy, event, context) {
    this.isActive(false);
    if (context.dragging) {
      this.ondragend(dx, dy, event, context);
    } else if (context.timer) {
      clearTimeout(context.timer);
      context.timer = null;
    }
  };

  SidebarModule.prototype.ondragstart = function(x, y, event, context) {
    context.dragging = true;
    context.timer = null;
    context.x = dom.offsetLeft(this.element());
    context.y = dom.offsetTop(this.element());

    context.clone = new SidebarModule.Clone({
      element: this.renderClone(),
      parentElement: dom.body(),
      x: context.x,
      y: context.y,
    });

    context.clone.markDirty();
    this.emit('dragstart');
  };

  SidebarModule.prototype.ondragmove = function(dx, dy, event, context) {
    context.clone.x(context.x + dx);
    context.clone.y(context.y + dy);
  };

  SidebarModule.prototype.ondragend = function(dx, dy, event, context) {
    context.dragging = false;
    context.clone.parentElement(null);
    this.emit('dragend');
    this.emit('drop', this.name(), context.x + dx, context.y + dy);
  };

  SidebarModule.HTML_TEXT = [
    '<div class="sidebar-module hoverable">',
      '<div class="sidebar-module-header sidebar-module-item"></div>',
      '<div class="sidebar-module-content sidebar-module-item"></div>',
    '</div>',
  ].join('');

  SidebarModule.Clone = (function() {
    var Clone = Component.inherits(function(props) {
      this.x = this.prop(props.x);
      this.y = this.prop(props.y);
    });

    Clone.prototype.onredraw = function() {
      this.redrawBy('x', 'y', function(x, y) {
        dom.translate(this.element(), x, y);
      });
    };

    return Clone;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarModule;
  } else {
    app.SidebarModule = SidebarModule;
  }
})(this.app || (this.app = {}));
