(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var SidebarModule = helper.inherits(function(props) {
    SidebarModule.super_.call(this, props);

    this.title = this.prop(props.title);
    this.content = this.prop(props.content);
    this.name = this.prop(props.name);
    this.parentElement = this.prop(null);

    this.draggable = null;

    this.dragStarter = props.dragStarter;
    this.dragEnder = props.dragEnder;
    this.dropper = props.dropper;
  }, Component);

  SidebarModule.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  SidebarModule.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
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
    var element = dom.el('<div>');
    dom.addClass(element, 'module');
    dom.html(element, SidebarModule.TEMPLATE_HTML);
    return element;
  };

  SidebarModule.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element) {
      return;
    }

    // add element
    if (parentElement && !element) {
      this.element(this.render());
      this.registerDragListener();
      this.redraw();
      dom.append(parentElement, this.element());
      return;
    }

    // remove element
    if (!parentElement && element) {
      this.unregisterDragListener();
      dom.remove(element);
      this.element(null);
      this.cache({});
      return;
    }

    // update element
    this.redrawTitle();
    this.redrawContent();
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

  SidebarModule.prototype.onstart = function(x, y, event, context) {
    var showCloneElement = function() {
      var cloneElement = this.makeCloneElement();
      var rect = dom.rect(this.element());
      var left = rect.left + dom.scrollX();
      var top = rect.top + dom.scrollY();

      dom.translate(cloneElement, left, top);
      dom.append(dom.body(), cloneElement);

      context.cloneElement = cloneElement;
      context.left = left;
      context.top = top;
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
      dom.translate(context.cloneElement, context.left + dx, context.top + dy);
    } else if (context.timer && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      clearTimeout(context.timer);
      context.timer = null;
    }
  };

  SidebarModule.prototype.onend = function(dx, dy, event, context) {
    var cloneElement = context.cloneElement;
    if (cloneElement) {
      var rect = dom.rect(cloneElement);
      dom.remove(cloneElement);
      this.dragEnder();
      this.dropper(this.name(), rect.left, rect.top);
    } else if (context.timer) {
      clearTimeout(context.timer);
      context.timer = null;
    }
  };

  SidebarModule.TEMPLATE_HTML = [
    '<div class="module-header"></div>',
    '<div class="module-content"></div>',
  ].join('');

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarModule;
  } else {
    app.SidebarModule = SidebarModule;
  }
})(this.app || (this.app = {}));
