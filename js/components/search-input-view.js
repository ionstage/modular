var searchInputView = (function() {
  var _element = null;
  var preInputValue = '';
  var isTouchEnabled = dom.supportsTouch();
  var isFocus = false;
  function inElement(point) {
    return point.x < 280 && point.y < 46;
  }
  function element(value) {
    _element = value;
    if (isTouchEnabled) {
      _element.className = 'touch';
      document.addEventListener('touchstart', function(event) {
        if (!(inElement({x: event.pageX, y: event.pageY})))
          _element.blur();
      }, false);
    } else {
      _element.addEventListener('blur', function() {
        isFocus = false;
      }, false);
      _element.addEventListener('click', function() {
        if (!isFocus && _element.selectionStart === _element.selectionEnd) {
          _element.select();
          isFocus = true;
        }
      }, false);
    }
    function triggerInputEvent(event) {
      var value = event.target.value;
      if (preInputValue !== value) {
        searchInputView.trigger({type: 'input'});
        preInputValue = value;
      }
    }
    _element.value = preInputValue;
    _element.addEventListener('keyup', triggerInputEvent, false);
    _element.addEventListener('input', triggerInputEvent, false);
  }
  function inputValue() {
    return _element.value;
  }
  return lib.event.enable({
    element: element,
    inputValue: inputValue
  });
}());