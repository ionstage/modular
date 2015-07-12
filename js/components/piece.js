var piece = (function() {
  var zIndexCount = 0;
  var addClass = dom.addClass;
  var removeClass = dom.removeClass;
  var templateNode = null;
  function template(node) {
    templateNode = dom.createNode(node.innerHTML);
  }
  function createPiece(src) {
    var node = templateNode.cloneNode(true);
    var map = {
      element: node,
      header: node.children[0],
      headerTitle: node.children[0].children[0],
      headerDeleteButton: node.children[0].children[1],
      content: node.children[1],
      componentBack: node.children[1].children[0],
      component: node.children[1].children[1],
      portList: node.children[1].children[2],
      footer: node.children[2],
      portSelect: node.children[2].children[0],
      portSelectOptionGroup: {
        prop: node.children[2].children[0].children[1],
        event: node.children[2].children[0].children[2]
      }
    };
    map.component.setAttribute('src', src);
    return map;
  }
  function create(src) {
    var p = Object.create(this);
    var elementMap = createPiece(src);
    p._elementMap = elementMap;
    zIndexCount += 1;
    p._zIndex = zIndexCount;
    elementMap.portSelect.addEventListener('change', boardEvent.showPort, false);
    p._src = src;
    p._isLoading = true;
    return p;
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
    var elementMap = this._elementMap;
    removeClass(elementMap.element, 'loading');
    removeClass(elementMap.headerTitle, 'loading');
    removeClass(elementMap.content, 'loading');
    removeClass(elementMap.portList, 'hide');
    removeClass(elementMap.footer, 'loading');
    this.updatePosition();
    this._isLoading = false;
  }
  function id(value) {
    if (!value)
      return this._id;
    this._id = value;
    this._elementMap.element.setAttribute('data-piece-id', value);
    this._elementMap.component.setAttribute('src', this._src + '#' + value);
  }
  function label(value) {
    if (value)
      this._elementMap.headerTitle.textContent = value;
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
      elementMap.componentBack.style.height = value;
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
    this._isShowingInConnector =
      (portListElement.querySelectorAll('.port-connector-in').length !== 
       portListElement.querySelectorAll('.port-connector-in.hide').length);
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
    this._isShowingInConnector =
      (portListElement.querySelectorAll('.port-connector-in').length !== 
       portListElement.querySelectorAll('.port-connector-in.hide').length);
    this.updatePosition();
  }
  function portMap() {
    return this._portMap;
  }
  function showComponentBack() {
    removeClass(this._elementMap.componentBack, 'hide');
  }
  function hideComponentBack() {
    addClass(this._elementMap.componentBack, 'hide');
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
    template: template,
    create: create,
    destroy: destroy,
    vitalize: vitalize,
    id: id,
    label: label,
    position: position,
    componentHeight: componentHeight,
    updatePosition: updatePosition,
    element: element,
    setPorts: setPorts,
    showPort: showPort,
    hidePort: hidePort,
    portMap: portMap,
    showComponentBack: showComponentBack,
    hideComponentBack: hideComponentBack,
    toFront: toFront,
    addClassOfHeader: addClassOfHeader,
    removeClassOfHeader: removeClassOfHeader,
    getAttribute: getAttribute,
    isLoading: isLoading,
    getComponentElement: getComponentElement
  };
}());