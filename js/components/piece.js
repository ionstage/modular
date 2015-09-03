(function(app) {
  'use strict';
  var m = require('mithril');

  var Piece = function(option) {
    this.id = m.prop('');
    this.x = m.prop(option.x || 0);
    this.y = m.prop(option.y || 0);
    this.label = m.prop(option.label || '');
    this.src = m.prop(option.src);
    this.portMap = m.prop({});
    this.ports = m.prop([]);
    this.isLoading = m.prop(true);
    this.element = m.prop(null);
    this.componentHeight = componentHeightProp(0);
    this.zIndex = m.prop(zIndexCount);
    this.isShowingInConnector = m.prop(false);

    zIndexCount++;
  };

  Piece.prototype.initializeElement = function(element) {
    this.element(element);
    this.updatePosition();
  };

  Piece.prototype.destroy = function() {
    var pieceID = this.id();
    var portMap = this.portMap();
    for (var portName in portMap) {
      boardEvent.removePortConnection(pieceID + '/' + portName);
    }
  };

  Piece.prototype.vitalize = function() {
    this.updatePosition();
    this.isLoading(false);
  };

  Piece.prototype.position = function(point) {
    if (typeof point === 'undefined')
      return {x: this.x(), y: this.y()};

    if ('x' in point) {
      var x = Math.max(point.x, this.isShowingInConnector() ? 46 : 0);
      this.x(x);
    }

    if ('y' in point) {
      var y = Math.max(point.y, 0);
      this.y(y);
    }
  };

  Piece.prototype.updatePosition = function() {
    var element = this.element();
    if (element) {
      var x = Math.max(this.x(), this.isShowingInConnector() ? 46 : 0);
      this.x(x);
      dom.translate(element, this.x(), this.y());
      element.style.zIndex = this.zIndex();
    }
  };

  Piece.prototype.updateIsShowingInConnector = function() {
    var isShowingInConnector = this.ports().some(function(port) {
      return port.isShowing() && port.hasIn();
    });
    this.isShowingInConnector(isShowingInConnector);
  };

  Piece.prototype.updatePortListOrder = function() {
    var portMap = this.portMap();
    var ports = this.ports();
    var portElements = this.element().children[1].children[1].children;

    var currentShowingPorts = Array.prototype.slice.call(portElements).map(function(portElement) {
      var idList = portElement.getAttribute('data-port-id').split('/');
      return portMap[idList[1] + '/' + idList[2]];
    }).filter(function(port) {
      return port.isShowing();
    });

    var currentHiddenPorts = ports.filter(function(port) {
      return currentShowingPorts.indexOf(port) === -1;
    }).sort(function(a, b) {
      if (a.isShowing() && !b.isShowing())
        return -1;
      else if (!a.isShowing() && b.isShowing())
        return 1;
      else
        return 0;
    });

    this.ports(currentShowingPorts.concat(currentHiddenPorts));
  };

  Piece.prototype.getInConnectorOffset = function(port) {
    var index = this.ports().indexOf(port);
    var componentHeight = parseInt(this.componentHeight());
    return {
      x: this.x() - 46,
      y: this.y() + 34 + (componentHeight || -2) + index * 46 + 4
    };
  };

  Piece.prototype.getOutConnectorOffset = function(port) {
    var index = this.ports().indexOf(port);
    var componentHeight = parseInt(this.componentHeight());
    return {
      x: this.x() + 240,
      y: this.y() + 34 + (componentHeight || -2) + index * 46 + 4
    };
  };

  Piece.prototype.setPorts = function(ports) {
    var pieceID = this.id();
    var map = {};
    var list = [];
    for (var i = 0, len = ports.length; i < len; i++) {
      var port = ports[i];
      var portName = port.name();
      port.pieceID(pieceID);
      if (port.isDefault())
        this.showPort(port);
      else
        this.hidePort(port);
      map[portName] = port;
      list.push(port);
    }
    this.portMap(map);
    this.ports(list);
    this.updateIsShowingInConnector();
  };

  Piece.prototype.showPort = function(port) {
    if (port.isShowing())
      return;

    // change port order
    var ports = this.ports();
    for (var i = ports.length - 1; i >= 0; i--) {
      if (ports[i] === port)
        ports.splice(i, 1);
    }
    ports.push(port);

    port.show();
    this.updatePortListOrder();
    this.updateIsShowingInConnector();
    this.updatePosition();

    // XXX: showing as last port
    m.redraw(true);
    var element = this.element();
    var portElement = port.element();
    if (element && portElement)
      element.children[1].children[1].appendChild(portElement);
  };

  Piece.prototype.hidePort = function(port) {
    port.hide();
    this.updatePortListOrder();
    this.updateIsShowingInConnector();
    this.updatePosition();
    m.redraw();
  };

  Piece.prototype.toFront = function() {
    zIndexCount++;
    this.zIndex(zIndexCount);
  };

  Piece.prototype.getAttribute = function() {
    return {
      id: this.id(),
      src: this.src(),
      x: this.x(),
      y: this.y()
    };
  };

  Piece.prototype.getComponentElement = function() {
    return this.element().children[1].children[0];
  };

  var componentHeightProp = function(initialValue) {
    var cacheProp = m.prop(initialValue);
    return function(value) {
      if (typeof value === 'undefined')
        return cacheProp();

      cacheProp(value);

      var element = this.element();
      if (parseInt(value) === 0 && element)
        dom.addClass(element.children[1].children[0], 'hide');
    };
  };

  var zIndexCount = 1;

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Piece;
  else
    app.Piece = Piece;
})(this.app || (this.app = {}));