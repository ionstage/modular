var sideView = (function() {
  var _state = null;
  var _element = null;
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
          removeClass(_element.dividerIcon, 'tap');
        },
        cancel: function() {
          removeClass(_element.dividerIcon, 'tap');
        }
      });
      addClass(_element.dividerIcon, 'tap');
    }, false);
  }
  function open() {
    _state = 'open';
    removeClass(_element.sidePanel, 'close');
    this.trigger({type:'change'});
  }
  function close() {
    _state = 'close';
    addClass(_element.sidePanel, 'close');
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