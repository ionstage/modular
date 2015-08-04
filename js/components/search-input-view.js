var searchInputView = (function() {
  var _element = null;
  var preInputValue = '';
  var isTouchEnabled = dom.supportsTouch();
  var isFocus = false;
  function element(value) {
    _element = value;
    if (isTouchEnabled) {
      document.addEventListener('touchstart', function(event) {
        if (event.target !== _element)
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