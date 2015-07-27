var sideView = (function() {
  var _state = null;
  var _element = null;
  var isTouchEnabled = dom.supportsTouch();
  var addClass = dom.addClass;
  var removeClass = dom.removeClass;
  var preKeyword = null;
  function element(value) {
    var self = this;
    _element = value;
    var divider = _element.divider;
    dom.setMouseHoverEffect(divider);
    divider.addEventListener(dom.eventType.START, function(event) {
      dom.startTapEvent(event, {
        tap: function() {
          self.toggle();
          dom.setCursor('default');
          if (isTouchEnabled)
            removeClass(divider, 'tap');
        },
        cancel: function() {
          if (isTouchEnabled)
            removeClass(divider, 'tap');
        }
      });
      if (isTouchEnabled)
        addClass(divider, 'tap');
    }, false);
  }
  function open() {
    _state = 'open';
    _element.dividerIcon.textContent = '<';
    _element.sidePanel.className = '';
    this.trigger({type:'change'});
  }
  function close() {
    _state = 'close';
    _element.dividerIcon.textContent = '>';
    _element.sidePanel.className = 'close';
    this.trigger({type:'change'});
  }
  function toggle() {
    switch (_state) {
      case 'open':
        this.close();
        break;
      case 'close':
        this.open();
        break;
      default:
        break;
    }

  }
  function updatePieceListView() {
    var keyword = searchInputView.inputValue();
    var listItems = [];
    if (preKeyword === keyword)
      return;
    listItems = pieceList.search(keyword).toListViewItems();
    pieceListView.updateSearchedListItems(listItems);
    preKeyword = keyword;
  }
  return lib.event.enable({
    element: element,
    open: open,
    close: close,
    toggle: toggle,
    updatePieceListView: updatePieceListView
  });
}());