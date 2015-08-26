var piece = (function() {
  var m = require('mithril');

  var zIndexCount = 0;
  var addClass = dom.addClass;
  var removeClass = dom.removeClass;
  function create(src) {
    var p = Object.create(this);
    zIndexCount += 1;
    p._zIndex = zIndexCount;
    p._src = src;
    p._isLoading = true;
    p._portMap = {};
    return p;
  }
  function initializeElement(node) {
    this._element = node;
    this.updatePosition();
  }
  function destroy() {
    var pieceID = this._id;
    var portMap = this._portMap;
    for (var portName in portMap) {
      boardEvent.removePortConnection(pieceID + '/' + portName);
    }
  }
  function vitalize() {
    this.updatePosition();
    this._isLoading = false;
  }
  function id(value) {
    if (!value)
      return this._id;
    this._id = value;
  }
  function label(value) {
    if (!value)
      return this._label || '';
    this._label = value;
  }
  function src() {
    return this._src;
  }
  function position(point) {
    if (!point)
      return {x: this._x, y: this._y};
    if ('x' in point)
      this._x = Math.max(point.x, 0);
    if ('y' in point)
      this._y = Math.max(point.y, 0);
  }
  function componentHeight(value) {
    if (!value)
      return this._componentHeight || 0;
    this._componentHeight = value;
  }
  function updatePosition() {
    var element = this._element;
    this._x = Math.max(this._x, (this._isShowingInConnector) ? 46 : 0);
    if (element) {
      dom.translate(element, this._x, this._y);
      element.style.zIndex = this._zIndex;
    }
  }
  function updateIsShowingInConnector() {
    this._isShowingInConnector = this.ports().some(function(port) {
      return port.isShowing() && port.hasIn();
    });
  }
  function element() {
    return this._element;
  }
  function setPorts(ports) {
    var pieceID = this._id;
    var map = {};
    for (var i = 0, len = ports.length; i < len; i += 1) {
      var port = ports[i];
      var portName = port.type() + '/' + port.key();
      var portID = pieceID + '/' + portName;
      port.id(portID);
      if (port.isDefault())
        this.showPort(port);
      else
        this.hidePort(port);
      map[portName] = port;
    }
    this._portMap = map;
    this.updateIsShowingInConnector();
  }
  function showPort(port) {
    var portMap = this._portMap;
    var portName = port.type() + '/' + port.key();

    // XXX: change port order
    delete portMap[portName];
    portMap[portName] = port;

    port.show();
    this.updateIsShowingInConnector();
    this.updatePosition();
    m.redraw();
  }
  function hidePort(port) {
    port.hide();
    this.updateIsShowingInConnector();
    this.updatePosition();
    m.redraw();
  }
  function portMap() {
    return this._portMap;
  }
  function ports() {
    var portMap = this._portMap;
    return Object.keys(portMap).map(function(key) {
      return portMap[key];
    });
  }
  function toFront() {
    zIndexCount += 1;
    this._zIndex = zIndexCount;
  }
  function getAttribute() {
    return {
      id: this._id,
      src: this._src,
      x: this._x,
      y: this._y
    };
  }
  function isLoading() {
    return this._isLoading;
  }
  function getComponentElement() {
    return this._element.children[1].children[0];
  }
  return {
    create: create,
    initializeElement: initializeElement,
    destroy: destroy,
    vitalize: vitalize,
    id: id,
    label: label,
    src: src,
    position: position,
    componentHeight: componentHeight,
    updatePosition: updatePosition,
    updateIsShowingInConnector: updateIsShowingInConnector,
    element: element,
    setPorts: setPorts,
    showPort: showPort,
    hidePort: hidePort,
    portMap: portMap,
    ports: ports,
    toFront: toFront,
    getAttribute: getAttribute,
    isLoading: isLoading,
    getComponentElement: getComponentElement
  };
}());