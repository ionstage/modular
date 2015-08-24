var piece = (function() {
  var zIndexCount = 0;
  var addClass = dom.addClass;
  var removeClass = dom.removeClass;
  function create(src) {
    var p = Object.create(this);
    zIndexCount += 1;
    p._zIndex = zIndexCount;
    p._src = src;
    p._isLoading = true;
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

    map.portSelect.addEventListener('change', boardEvent.showPort, false);
    this._elementMap = map;
    this.updatePosition();
  }
  function destroy() {
    this._elementMap.portSelect.removeEventListener('change', boardEvent.showPort, false);
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
    var portElement = port.element();
    var pieceElementMap = this._elementMap;
    var portListElement = pieceElementMap.portList;
    if (portListElement.contains(portElement))
      return;
    portListElement.appendChild(portElement);
    var optionGroup = pieceElementMap.portSelectOptionGroup[port.type()];
    var options = optionGroup.children;
    for (var i = options.length - 1; i >= 0; i -= 1) {
      var option = options[i];
      if (option.value === port.id())
        optionGroup.removeChild(option);
    }
    var portSelectElement = pieceElementMap.portSelect;
    if (portSelectElement.options.length === 1)
      addClass(portSelectElement, 'hide');
    portSelectElement.value = '';
    portSelectElement.blur();
    var portListElement = pieceElementMap.portList;
    this._isShowingInConnector = (portListElement.children.length !==
                                  portListElement.querySelectorAll('.hide-connector-in').length);
    this.updatePosition();
  }
  function hidePort(port) {
    var portElement = port.element();
    var pieceElementMap = this._elementMap;
    var portListElement = pieceElementMap.portList;
    if (portListElement.contains(portElement))
      portListElement.removeChild(portElement);
    var newOption = document.createElement('option');
    newOption.value = port.id();
    newOption.textContent = port.contentText();
    var optionGroup = pieceElementMap.portSelectOptionGroup[port.type()];
    var _options = optionGroup.children, i, len, options = [];
    for (i = 0, len = _options.length; i < len; i += 1) {
      options.push(_options[i]);
    }
    options.push(newOption);
    options.sort(function(a, b) {
      return (a.textContent > b.textContent) ? 1 : -1;
    });
    for (i = 0, len = options.length; i < len; i += 1) {
      var option = options[i];
      optionGroup.appendChild(option);
    }
    var portSelectElement = pieceElementMap.portSelect;
    if (portSelectElement.options.length !== 1)
      removeClass(portSelectElement, 'hide');
    portSelectElement.value = '';
    portSelectElement.blur();
    this._isShowingInConnector = (portListElement.children.length !==
                                  portListElement.querySelectorAll('.hide-connector-in').length);
    this.updatePosition();
  }
  function portMap() {
    return this._portMap;
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
    toFront: toFront,
    addClassOfHeader: addClassOfHeader,
    removeClassOfHeader: removeClassOfHeader,
    getAttribute: getAttribute,
    isLoading: isLoading,
    getComponentElement: getComponentElement
  };
}());