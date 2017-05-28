(function(app) {
  'use strict';

  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var SidebarModule = Component.inherits(function(props) {
    this.title = this.prop(props.title);
    this.content = this.prop(props.content);
    this.name = this.prop(props.name);

    this.draggable = null;

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
    return new dom.Point({
      x: rect.left + dom.scrollX(),
      y: rect.top + dom.scrollY(),
    });
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

  SidebarModule.prototype.makeCloneElement = function() {
    var element = dom.clone(this.element());
    dom.addClass(element, 'clone');
    return element;
  };

  SidebarModule.prototype.delete = function() {
    this.parentElement(null);
  };

  SidebarModule.prototype.render = function() {
    return dom.render(SidebarModule.HTML_TEXT);
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
    var showCloneElement = function() {
      var cloneElement = this.makeCloneElement();
      var position = this.position();

      dom.translate(cloneElement, position.x, position.y);
      dom.append(dom.body(), cloneElement);

      context.cloneElement = cloneElement;
      context.x = position.x;
      context.y = position.y;
      context.timer = null;

      this.dragStarter();
    }.bind(this);

    if (dom.supportsTouch()) {
      context.cloneElement = null;
      context.timer = setTimeout(showCloneElement, 300);
    } else {
      dom.cancel(event);
      showCloneElement();
    }
  };

  SidebarModule.prototype.onmove = function(dx, dy, event, context) {
    if (context.cloneElement) {
      dom.translate(context.cloneElement, context.x + dx, context.y + dy);
    } else if (context.timer && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      clearTimeout(context.timer);
      context.timer = null;
    }
  };

  SidebarModule.prototype.onend = function(dx, dy, event, context) {
    var cloneElement = context.cloneElement;
    if (cloneElement) {
      dom.remove(cloneElement);
      this.dragEnder();
      this.dropper(this.name(), context.x + dx, context.y + dy);
    } else if (context.timer) {
      clearTimeout(context.timer);
      context.timer = null;
    }
  };

  SidebarModule.HTML_TEXT = [
    '<div class="sidebar-module">',
      '<div class="sidebar-module-header sidebar-module-item"></div>',
      '<div class="sidebar-module-content sidebar-module-item"></div>',
    '</div>',
  ].join('');

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarModule;
  } else {
    app.SidebarModule = SidebarModule;
  }
})(this.app || (this.app = {}));
