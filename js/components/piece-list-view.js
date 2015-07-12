var pieceListView = (function() {
  var _element = null;
  var _listItems = null;
  var isTouchEnabled = dom.supportsTouch();
  var templateNode = null;
  var setListItemDragEvent = (function() {
    var START = isTouchEnabled ? 'touchstart' : 'mousedown';
    var MOVE = isTouchEnabled ? 'touchmove' : 'mousemove';
    var END = isTouchEnabled ? 'touchend' : 'mouseup';
    return function(element, option) {
      var cloneNode;
      var cloneOffset;
      var draggingNode;
      var isFirstDrag;
      var isAutoClose;
      function startListener(event) {
        var node = event.target.parentNode;
        if (node.className  === 'piece-list-item-container') {
          cloneNode = node.cloneNode(true);
          var pieceListContent = element.children[0];
          cloneOffset = {left: node.offsetLeft - pieceListContent.scrollLeft,
                         top: node.offsetTop - pieceListContent.scrollTop};
          node.style.cssText = dom.makeCSSText({opacity: 0.6});
          draggingNode = node;
          dom.addClass(cloneNode, 'drag');
          document.body.appendChild(cloneNode);
          if (document.activeElement && document.activeElement.blur)
            document.activeElement.blur();
          isFirstDrag = true;
          isAutoClose = false;
          dom.startDragEvent(event, {
            drag: dragListener,
            end: endListener
          });
        }
      }
      function dragListener(dx, dy) {
        if (isFirstDrag) {
          isFirstDrag = false;
          if (board.clientWidth() < 46) {
            isAutoClose = true;
            sideView.close();
          }
        }
        var cssText = dom.makeCSSText({
          left: (cloneOffset.left + dx) + 'px',
          top: (cloneOffset.top + dy) + 'px'
        });
        cloneNode.style.cssText = cssText;
      }
      function endListener(dx, dy) {
        draggingNode.style.cssText = '';
        document.body.removeChild(cloneNode);
        if (dx !== 0 || dy !== 0) {
          var pageX = cloneOffset.left + dx;
          var pageY = cloneOffset.top + dy;
          var dragEndEvent = {
            type:'dragend',
            pageX: pageX,
            pageY: pageY,
            pieceSrc: cloneNode.getAttribute('data-piece-src'),
            pieceLabel: cloneNode.children[0].textContent
          };
          pieceListView.trigger(dragEndEvent);
        }
        if (isAutoClose)
          sideView.open();
      }
      function clearTouchEvent(target) {
        isHold = false;
        if (tapHoldTimer !== null)
          clearTimeout(tapHoldTimer);
        document.removeEventListener(MOVE, touchMoveListener, false);
        document.removeEventListener(END, touchEndListener, false);
      }
      function touchMoveListener(event) {
        event = isTouchEnabled ? event.touches[0] : event;
        var dx = Math.abs(event.pageX - startOffset.left);
        var dy = Math.abs(event.pageY - startOffset.top);
        if (dx > 5 || dy > 5)
          clearTouchEvent();
      }
      function touchEndListener(event) {
        clearTouchEvent();
      }
      if (isTouchEnabled) {
        var isHold = true;
        var tapHoldTimer = null;
        var startOffset;
        element.addEventListener(START, function(event) {
          isHold = true;
          var touch = event.touches[0];
          startOffset = {left: touch.pageX, top: touch.pageY};
          if (tapHoldTimer !== null)
            clearTimeout(tapHoldTimer);
          tapHoldTimer = setTimeout(function() {
            tapHoldTimer = null;
            if (isHold) {
              document.removeEventListener(MOVE, touchMoveListener, false);
              document.removeEventListener(END, touchEndListener, false);
              startListener(event);
            }
          }, 300);
          document.addEventListener(MOVE, touchMoveListener, false);
          document.addEventListener(END, touchEndListener, false);
        }, false);
      } else {
        element.addEventListener(START, startListener, false);
      }
    };
  }());
  function setListItemHoverStyle() {
    var styleText = '.piece-list-item-container:hover {opacity: 0.6;}';
    var style = document.createElement('style');
    style.appendChild(document.createTextNode(styleText));
    document.getElementsByTagName('head')[0].appendChild(style);
  }
  function template(node) {
    templateNode = dom.createNode(node.innerHTML);
  }
  function createPieceListItem(titleText, contentText, pieceSrc) {
    var node = templateNode.cloneNode(true);
    var map = {
      element: node,
      container: node.children[0],
      containerHeader: node.children[0].children[0],
      containerContent: node.children[0].children[1]
    };
    map.container.setAttribute('data-piece-src', pieceSrc);
    map.containerHeader.textContent = titleText || '';
    map.containerContent.textContent = contentText || '';
    return map;
  }
  function element(value) {
    _element = value;
    setListItemDragEvent(_element);
    if (!isTouchEnabled)
      setListItemHoverStyle();
  }
  function listItems(value) {
    _listItems = value;
  }
  function update(isRecentryUsed) {
    var listItems = _listItems;
    var contentNode = document.createElement('div');
    var preContentNode = _element.children[0];
    contentNode.id = 'piece_list_content';
    var titleHTMLText = isRecentryUsed ? '<div id="piece_list_title">Recentry Used</div>' : '';
    if (isTouchEnabled)
      preContentNode.innerHTML = titleHTMLText;
    else
      contentNode.innerHTML = titleHTMLText;
    for (var i = 0, len = listItems.length; i < len; i += 1) {
      var item = listItems[i];
      var node = createPieceListItem(item.title, item.content, item.pieceSrc);
      if (isTouchEnabled)
        preContentNode.appendChild(node.element);
      else
        contentNode.appendChild(node.element);
    }
    if (!isTouchEnabled)
      _element.replaceChild(contentNode, preContentNode);
  }
  function updateSearchedListItems(listItems) {
    this.listItems(listItems);
    this.update();
  }
  function updateRecentryUsedListItems(listItems) {
    this.listItems(listItems);
    this.update(true);
  }
  return lib.event.enable({
    template: template,
    element: element,
    listItems: listItems,
    update: update,
    updateSearchedListItems: updateSearchedListItems,
    updateRecentryUsedListItems: updateRecentryUsedListItems
  });
}());