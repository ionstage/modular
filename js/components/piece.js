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
    var map = {
      element: node,
      header: node.children[0],
      headerTitle: node.children[0].children[0],
      headerDeleteButton: node.children[0].children[1],
      content: node.children[1],
      component: node.children[1].children[0],
      portList: node.children[1].children[1],
      footer: node.children[2],
      portSelect: node.children[2].children[0],
      portSelectOptionGroup: {
        prop: node.children[2].children[0].children[1],
        event: node.children[2].children[0].children[2]
      }
    };

    this._elementMap = map;
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
    if (value) {
      var elementMap = this._elementMap;
      elementMap.component.style.height = value;
      if (parseInt(value) === 0) {
        addClass(elementMap.component, 'hide');
        addClass(elementMap.portList, 'no-component');
      }
    }
  }
  function updatePosition() {
    this._x = Math.max(this._x, (this._isShowingInConnector) ? 46 : 0);
    var cssText = dom.makeCSSText({
      left: this._x + 'px',
      top: this._y + 'px',
      'z-index': this._zIndex
    });
    if (this._elementMap)
      this._elementMap.element.style.cssText = cssText;
  }
  function element() {
    return this._elementMap.element;
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
  }
  function showPort(port) {
    port.show();
    this._isShowingInConnector = this.ports().some(function(port) {
      return port.isShowing() && port.hasIn();
    });
    this.updatePosition();
    m.redraw();
  }
  function hidePort(port) {
    port.hide();
    this._isShowingInConnector = this.ports().some(function(port) {
      return port.isShowing() && port.hasIn();
    });
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
  function addClassOfHeader(className) {
    addClass(this._elementMap.header, className);
  }
  function removeClassOfHeader(className) {
    removeClass(this._elementMap.header, className);
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
    return this._elementMap.component;
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
    element: element,
    setPorts: setPorts,
    showPort: showPort,
    hidePort: hidePort,
    portMap: portMap,
    ports: ports,
    toFront: toFront,
    addClassOfHeader: addClassOfHeader,
    removeClassOfHeader: removeClassOfHeader,
    getAttribute: getAttribute,
    isLoading: isLoading,
    getComponentElement: getComponentElement
  };
}());