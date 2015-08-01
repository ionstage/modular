var connectorHandle = (function() {
  var handleElement = createHandleElement();
  var mainPanel = null;
  var currentType = null;
  function createHandleElement() {
    var node = document.createElement('div');
    node.className = 'port-connector-out drag hide';
    return node;
  }
  function element(value) {
    mainPanel = value.mainPanel;
    mainPanel.appendChild(handleElement);
  }
  function show() {
    dom.removeClass(handleElement, 'hide');
  }
  function hide() {
    dom.addClass(handleElement, 'hide');
  }
  function update() {
    dom.translate(handleElement, this._x, this._y);
  }
  function position(point) {
    if (!point)
      return {x: this._x, y: this._y};
    if ('x' in point)
      this._x = point.x;
    if ('y' in point)
      this._y = point.y;
  }
  function type(value) {
    if (currentType)
      dom.removeClass(handleElement, currentType);
    dom.addClass(handleElement, value);
    currentType = value;
  }
  return {
    element: element,
    show: show,
    hide: hide,
    update: update,
    position: position,
    type: type
  };
}());