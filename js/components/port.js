var port = (function() {
  var addClass = dom.addClass;
  var removeClass = dom.removeClass;
  var templateNode = null;
  function template(node) {
    templateNode = dom.createNode(node.innerHTML);
  }
  function createPort(type, contentText, hasIn, hasOut) {
    var node = templateNode.cloneNode(true);
    addClass(node, type);
    if (!hasIn)
      addClass(node, 'hide-connector-in');
    if (!hasOut)
      addClass(node, 'hide-connector-out');
    node.children[1].children[0].textContent = contentText;
    return node;
  }
  function create(type, key, contentText, hasIn, hasOut, isDefault) {
    var p = Object.create(this);
    p._element = createPort(type, contentText, hasIn, hasOut);
    p._type = type;
    p._key = key;
    p._isDefault = isDefault;
    p._contentText = contentText;
    return p;
  }
  function id(value) {
    if (!value)
      return this._id;
    this._id = value;
    this._element.setAttribute('data-port-id', value);
  }
  function type() {
    return this._type;
  }
  function key() {
    return this._key;
  }
  function element() {
    return this._element;
  }
  function isDefault() {
    return this._isDefault;
  }
  function contentText() {
    return this._contentText;
  }
  function showConnectorConnected() {
    removeClass(this._element, 'hide-connector-connected');
  }
  function hideConnectorConnected() {
    addClass(this._element, 'hide-connector-connected');
  }
  function getOutConnectorElement() {
    return this._element.children[0].children[2];
  }
  function getInConnectorElement() {
    return this._element.children[0].children[0];
  }
  function setFlushInConnector(flag) {
    if (flag)
      addClass(this._element, 'flush-connector-in');
    else
      removeClass(this._element, 'flush-connector-in');
  }
  function setFlushConnectorConnected(flag) {
    if (flag)
      addClass(this._element, 'flush-connector-connected');
    else
      removeClass(this._element, 'flush-connector-connected');
  }
  function setFlushOutConnector(flag) {
    if (flag)
      addClass(this._element, 'flush-connector-out');
    else
      removeClass(this._element, 'flush-connector-out');
  }
  function mark() {
    addClass(this._element, 'mark');
  }
  function clearMark() {
    removeClass(this._element, 'mark');
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