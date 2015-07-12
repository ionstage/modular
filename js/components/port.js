var port = (function() {
  var addClass = dom.addClass;
  var removeClass = dom.removeClass;
  var templateNode = null;
  function template(node) {
    templateNode = dom.createNode(node.innerHTML);
  }
  function createPort(type, contentText, hasIn, hasOut) {
    var node = templateNode.cloneNode(true);
    dom.addClass(node, type);
    var map = {
      element: node,
      connector: node.children[0],
      connectorIn: node.children[0].children[0],
      connectorConnected: node.children[0].children[1],
      connectorOut: node.children[0].children[2],
      content: node.children[1],
      contentText: node.children[1].children[0],
      contentDeleteButton: node.children[1].children[1]
    };
    map.contentText.textContent = contentText;
    if (!hasIn)
      dom.addClass(map.connectorIn, 'hide');
    if (!hasOut)
      dom.addClass(map.connectorOut, 'hide');
    return map;
  }
  function create(type, key, contentText, hasIn, hasOut, isDefault) {
    var p = Object.create(this);
    var elementMap = createPort(type, contentText, hasIn, hasOut);
    p._elementMap = elementMap;
    p._type = type;
    p._key = key;
    p._isDefault = isDefault;
    p._contentText = contentText;
    addClass(elementMap.connectorConnected, 'hide');
    return p;
  }
  function id(value) {
    if (!value)
      return this._id;
    this._id = value;
    this._elementMap.element.setAttribute('data-port-id', value);
  }
  function type() {
    return this._type;
  }
  function key() {
    return this._key;
  }
  function element() {
    return this._elementMap.element;
  }
  function isDefault() {
    return this._isDefault;
  }
  function contentText() {
    return this._contentText;
  }
  function showConnectorConnected() {
    removeClass(this._elementMap.connectorConnected, 'hide');
  }
  function hideConnectorConnected() {
    addClass(this._elementMap.connectorConnected, 'hide');
  }
  function getOutConnectorElement() {
    return this._elementMap.connectorOut;
  }
  function getInConnectorElement() {
    return this._elementMap.connectorIn;
  }
  function setFlushInConnector(flag) {
    if (flag)
      addClass(this._elementMap.connectorIn, 'flush');
    else
      removeClass(this._elementMap.connectorIn, 'flush');
  }
  function setFlushConnectorConnected(flag) {
    if (flag)
      addClass(this._elementMap.connectorConnected, 'flush');
    else
      removeClass(this._elementMap.connectorConnected, 'flush');
  }
  function setFlushOutConnector(flag) {
    if (flag)
      addClass(this._elementMap.connectorOut, 'flush');
    else
      removeClass(this._elementMap.connectorOut, 'flush');
  }
  function mark() {
    addClass(this._elementMap.element, 'mark');
  }
  function clearMark() {
    removeClass(this._elementMap.element, 'mark');
  }
  return {
    template: template,
    create: create,
    id: id,
    type: type,
    key: key,
    element: element,
    isDefault: isDefault,
    contentText: contentText,
    showConnectorConnected: showConnectorConnected,
    hideConnectorConnected: hideConnectorConnected,
    getOutConnectorElement: getOutConnectorElement,
    getInConnectorElement: getInConnectorElement,
    setFlushInConnector: setFlushInConnector,
    setFlushConnectorConnected: setFlushConnectorConnected,
    setFlushOutConnector: setFlushOutConnector,
    mark: mark,
    clearMark: clearMark
  };
}());