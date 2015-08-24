var port = (function() {
  var addClass = dom.addClass;
  var removeClass = dom.removeClass;
  function create(type, key, contentText, hasIn, hasOut, isDefault) {
    var p = Object.create(this);
    p._type = type;
    p._key = key;
    p._hasIn = hasIn;
    p._hasOut = hasOut;
    p._isDefault = isDefault;
    p._isShowing = isDefault;
    p._contentText = contentText;
    return p;
  }
  function initializeElement(node) {
    this._element = node;
    addClass(node, this._type);
    if (!this._hasIn)
      addClass(node, 'hide-connector-in');
    if (!this._hasOut)
      addClass(node, 'hide-connector-out');
  }
  function id(value) {
    if (!value)
      return this._id;
    this._id = value;
  }
  function type() {
    return this._type;
  }
  function key() {
    return this._key;
  }
  function hasIn() {
    return this._hasIn;
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
  function show() {
    this._isShowing = true;
  }
  function hide() {
    this._isShowing = false;
  }
  function isShowing() {
    return this._isShowing;
  }
  function showConnectorConnected() {
    removeClass(this._element, 'hide-connector-connected');
  }
  function hideConnectorConnected() {
    addClass(this._element, 'hide-connector-connected');
  }
  function getOutConnectorElement() {
    if (!this._element)
      return null;
    return this._element.children[0].children[2];
  }
  function getInConnectorElement() {
    if (!this._element)
      return null;
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
    create: create,
    initializeElement: initializeElement,
    id: id,
    type: type,
    key: key,
    hasIn: hasIn,
    element: element,
    isDefault: isDefault,
    contentText: contentText,
    show: show,
    hide: hide,
    isShowing: isShowing,
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