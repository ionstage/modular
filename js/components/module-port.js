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
    this.plugDisabled = this.prop(props.plugDisabled);
    this.socketDisabled = this.prop(props.socketDisabled);
    this.visible = this.prop(false);
    this.top = this.prop(0);
    this.height = this.prop(44);
    this.socketConnected = this.prop(false);
    this.isHighlighted = this.prop(false);
    this.plugHighlighted = this.prop(false);
    this.socketHighlighted = this.prop(false);
    this.listItemElement = this.prop(this.renderListItem());
    this.parentListElement = this.prop(props.parentListElement);
    this.optionElement = this.prop(this.renderOption());
    this.parentOptGroupElement = this.prop(props.parentOptGroupElement);
    this.cache = this.prop({});

    this.optionDeselector = props.optionDeselector;
    this.optGroupSorter = props.optGroupSorter;

    // update the list-item element or the option element
    this.markDirty();
  }, jCore.Component);

  ModulePort.prototype.hideable = function() {
    // don't hide highlighted port
    return !this.isHighlighted();
  };

  ModulePort.prototype.bottom = function() {
    return this.top() + this.height();
  };

  ModulePort.prototype.renderListItem = function() {
    var element = dom.el('<div>');

    dom.addClass(element, 'module-port');
    dom.data(element, 'type', this.type());

    var texts = [];

    if (!this.plugDisabled())
      texts.push('<div class="module-port-plug"></div>');

    if (!this.socketDisabled())
      texts.push('<div class="module-port-socket"><span></span></div>');

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
    var socketConnected = this.socketConnected();
    var isHighlighted = this.isHighlighted();
    var plugHighlighted = this.plugHighlighted();
    var socketHighlighted = this.socketHighlighted();
    var hideable = this.hideable();
    var cache = this.cache();

    if (top !== cache.top && visible) {
      var translate = 'translateY(' + top + 'px)';

      dom.css(this.listItemElement(), {
        transform: translate,
        webkitTransform: translate
      });

      cache.top = top;
    }

    if (socketConnected !== cache.socketConnected && visible) {
      dom.toggleClass(this.listItemElement(), 'module-port-socket-connected', socketConnected);
      cache.socketConnected = socketConnected;
    }

    if (cache.isHighlighted !== isHighlighted && visible) {
      dom.toggleClass(this.listItemElement(), 'module-port-highlight', isHighlighted);
      cache.isHighlighted = isHighlighted;
    }

    if (cache.plugHighlighted !== plugHighlighted && visible) {
      dom.toggleClass(this.listItemElement(), 'module-port-plug-highlight', plugHighlighted);
      cache.plugHighlighted = plugHighlighted;
    }

    if (cache.socketHighlighted !== socketHighlighted && visible) {
      dom.toggleClass(this.listItemElement(), 'module-port-socket-highlight', socketHighlighted);
      cache.socketHighlighted = socketHighlighted;
    }

    if (hideable !== cache.hideable && visible) {
      dom.toggleClass(this.listItemElement(), 'module-port-hide-disabled', !hideable);
      cache.hideable = hideable;
    }

    if (visible === cache.visible)
      return;

    if (visible) {
      dom.remove(this.optionElement());
      dom.append(this.parentListElement(), this.listItemElement());
    } else {
      dom.remove(this.listItemElement());
      dom.append(this.parentOptGroupElement(), this.optionElement());
    }

    this.optGroupSorter(this.type());
    this.optionDeselector();

    cache.visible = visible;
  };

  ModulePort.PLUG_OFFSET_X = 261;
  ModulePort.PLUG_WIDTH = 50;

  ModulePort.SOCKET_OFFSET_X = -25;
  ModulePort.SOCKET_WIDTH = 50;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ModulePort;
  else
    app.ModulePort = ModulePort;
})(this.app || (this.app = {}));
