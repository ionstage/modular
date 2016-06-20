(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var ModulePort = helper.inherits(function(props) {
    ModulePort.super_.call(this);

    this.label = this.prop(props.label);
    this.name = this.prop(props.name);
    this.type = this.prop(props.type);
    this.socketDisabled = this.prop(props.socketDisabled);
    this.plugDisabled = this.prop(props.plugDisabled);
    this.visible = this.prop(false);
    this.top = this.prop(0);
    this.height = this.prop(44);
    this.listItemElement = this.prop(this.renderListItem());
    this.parentListElement = this.prop(props.parentListElement);
    this.element = this.prop(null);
    this.cache = this.prop({});
  }, jCore.Component);

  ModulePort.prototype.renderListItem = function() {
    var element = dom.el('<div>');

    dom.addClass(element, 'module-port');
    dom.addClass(element, 'module-port-' + this.type());

    var texts = [];

    if (!this.socketDisabled())
      texts.push('<div class="module-port-socket"></div>');

    if (!this.plugDisabled())
      texts.push('<div class="module-port-plug"></div>');

    texts.push('<div class="module-port-label">' + this.label() + '</div>');
    texts.push('<img class="module-port-hide-button" src="images/minus-square-o.svg">');

    dom.html(element, texts.join(''));

    return element;
  };

  ModulePort.prototype.renderOption = function() {
    var element = dom.el('<option>');
    dom.text(element, this.label());
    dom.value(element, this.name());
    return element;
  };

  ModulePort.prototype.redraw = function() {
    var visible = this.visible();
    var top = this.top();
    var cache = this.cache();

    if (top !== cache.top && visible) {
      var translate = 'translateY(' + top + 'px)';

      dom.css(this.listItemElement(), {
        transform: translate,
        webkitTransform: translate
      });

      cache.top = top;
    }

    if (visible === cache.visible)
      return;

    if (visible)
      dom.append(this.parentListElement(), this.listItemElement());
    else
      dom.remove(this.listItemElement());

    cache.visible = visible;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModulePort;
  else
    app.ModulePort = ModulePort;
})(this.app || (this.app = {}));
