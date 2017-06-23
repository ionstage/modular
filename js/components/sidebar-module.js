(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var SidebarModule = Component.inherits(function(props) {
    this.title = this.prop(props.title);
    this.content = this.prop(props.content);
    this.name = this.prop(props.name);

    this.clone = new SidebarModule.Clone({
      renderer: SidebarModule.prototype.renderClone.bind(this),
    });

    this.draggable = null;

    this.ondragstart = SidebarModule.prototype.ondragstart.bind(this);
    this.ondragmove = SidebarModule.prototype.ondragmove.bind(this);
    this.ondragend = SidebarModule.prototype.ondragend.bind(this);

    this.dragStarter = props.dragStarter;
    this.dragEnder = props.dragEnder;
    this.dropper = props.dropper;
  });

  SidebarModule.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  SidebarModule.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
  };

  SidebarModule.prototype.position = function() {
    var rect = dom.rect(this.element());
    var bodyRect = dom.rect(dom.body());
    return {
      x: rect.left - bodyRect.left,
      y: rect.top - bodyRect.top,
    };
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

  SidebarModule.prototype.delete = function() {
    this.parentElement(null);
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
    this.redrawProp('title', function(title) {
      dom.text(this.headerElement(), title);
    });
  };

  SidebarModule.prototype.redrawContent = function() {
    this.redrawProp('content', function(content) {
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
    this.redrawTitle();
    this.redrawContent();
  };

  SidebarModule.prototype.onstart = function(x, y, event, context) {
    if (dom.supportsTouch()) {
      context.dragging = false;
      context.timer = setTimeout(this.ondragstart, 300, x, y, event, context);
    } else {
      dom.cancel(event);
      this.ondragstart(x, y, event, context);
    }
  };

  SidebarModule.prototype.onmove = function(dx, dy, event, context) {
    if (context.dragging) {
      this.ondragmove(dx, dy, event, context);
    } else if (context.timer && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      clearTimeout(context.timer);
      context.timer = null;
    }
  };

  SidebarModule.prototype.onend = function(dx, dy, event, context) {
    if (context.dragging) {
      this.ondragend(dx, dy, event, context);
    } else if (context.timer) {
      clearTimeout(context.timer);
      context.timer = null;
    }
  };

  SidebarModule.prototype.ondragstart = function(x, y, event, context) {
    var position = this.position();

    context.dragging = true;
    context.timer = null;
    context.x = position.x;
    context.y = position.y;

    this.clone.show(position.x, position.y);
    this.dragStarter();
  };

  SidebarModule.prototype.ondragmove = function(dx, dy, event, context) {
    this.clone.move(context.x + dx, context.y + dy);
  };

  SidebarModule.prototype.ondragend = function(dx, dy, event, context) {
    context.dragging = false;
    this.clone.hide();
    this.dragEnder();
    this.dropper(this.name(), context.x + dx, context.y + dy);
  };

  SidebarModule.HTML_TEXT = [
    '<div class="sidebar-module">',
      '<div class="sidebar-module-header sidebar-module-item"></div>',
      '<div class="sidebar-module-content sidebar-module-item"></div>',
    '</div>',
  ].join('');

  SidebarModule.Clone = (function() {
    var Clone = Component.inherits(function(props) {
      this.x = this.prop(0);
      this.y = this.prop(0);

      this.renderer = props.renderer;
    });

    Clone.prototype.move = function(x, y) {
      this.x(x);
      this.y(y);
    };

    Clone.prototype.show = function(x, y) {
      this.move(x, y);
      this.parentElement(dom.body());
    };

    Clone.prototype.hide = function() {
      this.parentElement(null);
    };

    Clone.prototype.render = function() {
      return this.renderer();
    };

    Clone.prototype.redrawPosition = function() {
      this.redrawProp('x', 'y', function(x, y) {
        dom.translate(this.element(), x, y);
      });
    };

    Clone.prototype.onredraw = function() {
      this.redrawPosition();
    };

    return Clone;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarModule;
  } else {
    app.SidebarModule = SidebarModule;
  }
})(this.app || (this.app = {}));
