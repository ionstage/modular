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
    this.draggable = this.prop(null);
    this.dragContext = this.prop({});

    this.dragStarter = props.dragStarter;
    this.dragEnder = props.dragEnder;
  }, Component);

  SidebarModule.prototype.headerElement = function() {
    return dom.child(this.element(), 0);
  };

  SidebarModule.prototype.contentElement = function() {
    return dom.child(this.element(), 1);
  };

  SidebarModule.prototype.registerDragListener = function() {
    this.draggable(new dom.Draggable({
      element: this.element(),
      onstart: SidebarModule.prototype.onstart.bind(this),
      onmove: SidebarModule.prototype.onmove.bind(this),
      onend: SidebarModule.prototype.onend.bind(this),
    }));
  };

  SidebarModule.prototype.unregisterDragListener = function() {
    this.draggable().destroy();
    this.draggable(null);
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
      this.dragContext({});
      return;
    }

    // update element
    this.redrawTitle();
    this.redrawContent();
  };

  SidebarModule.prototype.redrawTitle = function() {
    var title = this.title();
    var cache = this.cache();

    if (title === cache.title) {
      return;
    }

    dom.text(this.headerElement(), title);
    cache.title = title;
  };

  SidebarModule.prototype.redrawContent = function() {
    var content = this.content();
    var cache = this.cache();

    if (content === cache.content) {
      return;
    }

    dom.text(this.contentElement(), content);
    cache.content = content;
  };

  SidebarModule.prototype.onstart = function(x, y, event) {
    var context = this.dragContext();
    var cloneElement = this.makeCloneElement();
    var rect = dom.rect(this.element());
    var left = rect.left;
    var top = rect.top;

    dom.cancel(event);
    dom.translate(cloneElement, left, top);
    dom.append(dom.body(), cloneElement);

    context.cloneElement = cloneElement;
    context.left = left;
    context.top = top;

    this.dragStarter();
  };

  SidebarModule.prototype.onmove = function(dx, dy, event) {
    var context = this.dragContext();
    dom.translate(context.cloneElement, context.left + dx, context.top + dy);
  };

  SidebarModule.prototype.onend = function(dx, dy, event) {
    var context = this.dragContext();
    dom.remove(context.cloneElement);
    this.dragEnder();
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
