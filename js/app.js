(function(window) {
  'use strict';
  var Base64 = require('js-base64').Base64;

  var document = window.document;

  var lib = window.lib;
  var dom = window.dom;

  var nodeTemplate = (function() {
    var _element = null;
    var pieceListItemNode = null;
    var pieceNode = null;
    var portNode = null;
    function createNode(str) {
      var node = document.createElement('div');
      node.innerHTML = str.replace(/\r\n/g, '').trim();
      return node.firstChild;
    }
    function element(value) {
      _element = value;
      pieceListItemNode = createNode(_element.pieceListItemTemplate.innerHTML);
      pieceNode = createNode(_element.pieceTemplate.innerHTML);
      portNode = createNode(_element.portTemplate.innerHTML);
    }
    function createPieceListItem(titleText, contentText, pieceSrc) {
      var node = pieceListItemNode.cloneNode(true);
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
    function createPiece(src) {
      var node = pieceNode.cloneNode(true);
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
    function createPort(type, contentText, hasIn, hasOut) {
      var node = portNode.cloneNode(true);
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
    return {
      element: element,
      createPieceListItem: createPieceListItem,
      createPiece: createPiece,
      createPort: createPort
    };
  }());


  // side panel
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
      this.trigger({type:'change', state: _state});
    }
    function close() {
      _state = 'close';
      _element.dividerIcon.textContent = '>';
      _element.sidePanel.className = 'close';
      this.trigger({type:'change', state: _state});
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
      var listItems;
      if (keyword.length !== 0) {
        if (preKeyword === keyword)
          return;
        listItems = pieceList.search(keyword).toListViewItems();
        pieceListView.updateSearchedListItems(listItems);
      } else {
        listItems = recentryUsedPieceList.listViewItems();
        pieceListView.updateRecentryUsedListItems(listItems);
      }
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

  var pieceListView = (function() {
    var _element = null;
    var _listItems = null;
    var isTouchEnabled = dom.supportsTouch();
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
        var node = nodeTemplate.createPieceListItem(item.title, item.content, item.pieceSrc);
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
      element: element,
      listItems: listItems,
      update: update,
      updateSearchedListItems: updateSearchedListItems,
      updateRecentryUsedListItems: updateRecentryUsedListItems
    });
  }());

  var pieceList = (function() {
    var _list = [];
    var urlList = [];
    function list() {
      return _list;
    }
    function toListViewItems() {
      var listViewItems = [];
      for (var i = 0, len = this.length; i < len; i += 1) {
        var item = this[i];
        listViewItems.push({
          title: item.label,
          content: item.description,
          pieceSrc: item.src
        });
      }
      return listViewItems;
    }
    function isMatchTag(tagList, keyword) {
      for (var i = 0, len = tagList.length; i < len; i += 1) {
        if (tagList[i].toLowerCase().indexOf(keyword) !== -1)
          return true;
      }
      return false;
    }
    function search(keyword) {
      if (keyword.length === 0)
        return {length: 0, toListViewItems: toListViewItems};
      var list = _list;
      var labelMatchList = [];
      var labelMatchListSub = [];
      var tagMatchList = [];
      var descriptionMatchList = [];
      keyword = keyword.toLowerCase();
      for (var i = 0, len = list.length; i < len; i += 1) {
        var item = list[i];
        if (item.label.toLowerCase().indexOf(keyword) === 0)
          labelMatchList.push(item);
        else if (isMatchTag(item.tag, keyword))
          tagMatchList.push(item);
        else if (keyword.length >= 2 &&
                 item.label.toLowerCase().indexOf(keyword) !== -1)
          labelMatchListSub.push(item);
        else if (keyword.length >= 2 &&
                 item.description.toLowerCase().indexOf(keyword) !== -1)
          descriptionMatchList.push(item);
      }
      var matchList = labelMatchList.concat(tagMatchList, labelMatchListSub,
                                            descriptionMatchList);
      matchList.toListViewItems = toListViewItems;
      return matchList;
    }
    function loadFrameName(src, callback) {
      var iframeElement = document.createElement('iframe');
      iframeElement.style.cssText = dom.makeCSSText({
        position: 'absolute',
        visibility: 'hidden',
        width: '1px',
        height: '1px'
      });
      iframeElement.setAttribute('name', '');
      iframeElement.setAttribute('src', src);
      function endLoadFrameName(name) {
        document.body.removeChild(iframeElement);
        if (typeof callback === 'function')
          callback(name);
      }
      iframeElement.onload = function() {
        var retryCount = 0;
        setTimeout(function getFrameName() {
          var name = '';
          try {
            name = iframeElement.contentWindow.name;
          } catch (e) {}
          if (name !== '') {
            endLoadFrameName(name);
            return;
          }
          if (retryCount < 30) {
            retryCount += 1;
            setTimeout(getFrameName, 100);
          } else {
            endLoadFrameName(null);
          }
        }, 100);
      };
      document.body.appendChild(iframeElement);
    }
    function filterList() {
      var list = _list;
      var filteredList = [];
      var srcMap = {};
      for (var i = 0, len = list.length; i < len; i += 1) {
        var item = list[i];
        if (typeof srcMap[item.src] === 'undefined') {
          filteredList.push(item);
          srcMap[item.src] = true;
        }
      }
      filteredList.sort(function(a, b) {
        return a.label > b.label ? 1 : -1;
      });
      _list = filteredList;
    }
    function load(pieceLists, callback) {
      var pieceListsLength = pieceLists.length;
      function loadPieceList(index) {
        var url = pieceLists[index];
        if (urlList.indexOf(url) === -1) {
          loadFrameName(url, function(name) {
            if (name === null) {
              endLoadPieceList(index);
              return;
            }
            try {
              _list = _list.concat(JSON.parse(name));
            } catch (e) {
              endLoadPieceList(index);
              return;
            }
            urlList.push(url);
            endLoadPieceList(index);
          });
        } else {
          endLoadPieceList(index);
        }
      }
      function endLoadPieceList(index) {
        index += 1;
        if (index < pieceListsLength) {
          loadPieceList(index);
        } else {
          filterList();
          callback();
        }
      }
      loadPieceList(0);
    }
    function clear() {
      _list = [];
      urlList = [];
    }
    return {
      list: list,
      search: search,
      load: load,
      clear: clear
    };
  }());

  var recentryUsedPieceList = (function() {
    var isObject = lib.util.isObject;
    var storageKey = 'recentry-used'
    var _list = dom.loadData(storageKey);
    if (_list === null)
      _list = [];
    var maxSize = 20;
    function equal(a, b) {
      if (!isObject(a) || !isObject(b))
        return false;
      return a.src === b.src;
    }
    function listViewItems() {
      var recentryUsedList = _list;
      var currentList = pieceList.list();
      var listViewItems = [];
      for (var i = 0, len = recentryUsedList.length; i < len; i += 1) {
        for (var j = currentList.length - 1; j >= 0; j -= 1) {
          if (equal(recentryUsedList[i], currentList[j])) {
            var item = currentList[j];
            listViewItems.push({
              title: item.label,
              content: item.description,
              pieceSrc: item.src
            });
          }
        }
      }
      return listViewItems;
    }
    function update() {
      var recentryUsedList = _list;
      var currentList = pieceList.list();
      var newList = [];
      for (var i = 0, len = recentryUsedList.length; i < len; i += 1) {
        for (var j = currentList.length - 1; j >= 0; j -= 1) {
          if (equal(recentryUsedList[i], currentList[j]))
            newList.push(recentryUsedList[i]);
        }
      }
      _list = newList;
      dom.saveData(storageKey, _list);
    }
    function add(item) {
      var recentryUsedList = _list;
      for (var i = recentryUsedList.length - 1; i >= 0; i -= 1) {
        if (equal(recentryUsedList[i], item))
          recentryUsedList.splice(i, 1);
      }
      _list.unshift(item);
      _list.splice(maxSize);
      this.update();
    }
    return {
      listViewItems: listViewItems,
      update: update,
      add: add
    };
  }());

  var pieceListManager = (function() {
    var storageKey = 'piece-lists';
    var pieceLists = dom.loadData(storageKey);
    if (pieceLists === null) {
      pieceLists = ['piecelist/default.html'];
      dom.saveData(storageKey, pieceLists);
    }
    function element(value) {
      var button = value.button;
      button.addEventListener('click', function() {
        var base = Math.floor(Math.random() * Math.pow(10, 16)).toString();
        var managerWindow = window.open('piecelist/manager.html', CryptoJS.SHA1(base).toString(),
                                        'height=380,width=380,menubar=no,toolbar=no,location=no,status=no');
        if (managerWindow) {
          setTimeout(function watchManagerWindow() {
            if (managerWindow.closed) {
              pieceList.clear();
              pieceList.load(dom.loadData(storageKey), function() {
                recentryUsedPieceList.update();
                sideView.updatePieceListView();
              });
            } else {
              setTimeout(watchManagerWindow, 1000);
            }
          }, 1000);
        }
      });
    }
    return {
      element: element
    };
  }());


  // main panel
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
      var cssText = dom.makeCSSText({
        left: this._x + 'px',
        top: this._y + 'px'
      });
      handleElement.style.cssText = cssText;
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

  var pathContainer = (function() {
    var _element = null;
    var dirtyIDs = [];
    var positionMap = {};
    function createPathElement() {
      return document.createElementNS('http://www.w3.org/2000/svg', 'path');
    }
    function element(value) {
      _element = value;
    }
    function append(sourceID, targetID) {
      var path = _element.querySelector('[data-source-id="' + sourceID + '"]' +
                                        '[data-target-id="' + targetID + '"]');
      if (!path) {
        path = createPathElement();
        path.setAttribute('data-source-id', sourceID);
        path.setAttribute('data-target-id', targetID);
        _element.appendChild(path);
      }
    }
    function remove(sourceID, targetID) {
      var path = _element.querySelector('[data-source-id="' + sourceID + '"]' +
                                        '[data-target-id="' + targetID + '"]');
      if (path)
        _element.removeChild(path);
    }
    function change(oldIDSet, newIDSet) {
      if (oldIDSet[0] === newIDSet[0] && oldIDSet[1] === newIDSet[1])
        return;
      var path = _element.querySelector('[data-source-id="' + oldIDSet[0] + '"]' +
                                        '[data-target-id="' + oldIDSet[1] + '"]');
      if (path) {
        var newPath = _element.querySelector('[data-source-id="' + newIDSet[0] + '"]' +
                                             '[data-target-id="' + newIDSet[1] + '"]');
        if (newPath)
          this.remove(newIDSet[0], newIDSet[1]);
        path.setAttribute('data-source-id', newIDSet[0]);
        path.setAttribute('data-target-id', newIDSet[1]);

      }
    }
    function position(id, point) {
      dirtyIDs.push(id);
      positionMap[id] = point;
    }
    function updatePosition() {
      for (var i = 0, i_len = dirtyIDs.length; i < i_len; i += 1) {
        var id = dirtyIDs[i];
        var paths = _element.querySelectorAll('[data-source-id="' + id + '"],' +
                                              '[data-target-id="' + id + '"]');
        for (var j = 0, j_len = paths.length; j < j_len; j += 1) {
          var path = paths[j];
          var sourceID = path.getAttribute('data-source-id');
          var targetID = path.getAttribute('data-target-id');
          var sourcePoint = positionMap[sourceID];
          var targetPoint = positionMap[targetID];
          path.setAttribute('d', 'M' + sourcePoint.x + ',' + sourcePoint.y +
                                 'L' + targetPoint.x + ',' + targetPoint.y + 'Z');
        }
      }
      dirtyIDs = [];
    }
    function refreshPosition() {
      for (var id in positionMap) {
        var paths = _element.querySelectorAll('[data-source-id="' + id + '"],' +
                                              '[data-target-id="' + id + '"]');
        if (paths.length === 0)
          delete positionMap[id];
      }
    }
    function size(rect) {
      if ('width' in rect)
        _element.style.width = rect.width + 'px';
      if ('height' in rect)
        _element.style.height = rect.height + 'px';
    }
    function getSourceID(targetID) {
      var path = _element.querySelector('[data-target-id="' + targetID + '"]');
      if (path)
        return path.getAttribute('data-source-id');
      else
        return null;
    }
    function getTargetIDs(sourceID) {
      var targetIDs = [];
      var paths = _element.querySelectorAll('[data-source-id="' + sourceID + '"]');
      for (var i = 0, len = paths.length; i < len; i += 1) {
        targetIDs.push(paths[i].getAttribute('data-target-id'));
      }
      return targetIDs;
    }
    function setFlushPath(sourceID, targetID, flag) {
      var path = _element.querySelector('[data-source-id="' + sourceID + '"]' +
                                        '[data-target-id="' + targetID + '"]');
      if (path) {
        if (flag)
          path.setAttribute('class', 'flush');
        else
          path.removeAttribute('class');
      }
    }
    function getConnectionList() {
      var list = [];
      var paths = _element.childNodes;
      for (var i = 0, len = paths.length; i < len; i += 1) {
        var path = paths[i];
        list.push({
          sourceID: path.getAttribute('data-source-id'),
          targetID: path.getAttribute('data-target-id')
        });
      }
      return list;
    }
    return {
      element: element,
      append: append,
      remove: remove,
      change: change,
      position: position,
      updatePosition: updatePosition,
      refreshPosition: refreshPosition,
      size: size,
      getSourceID: getSourceID,
      getTargetIDs: getTargetIDs,
      setFlushPath: setFlushPath,
      getConnectionList: getConnectionList
    };
  }());

  var board = (function() {
    var mainPanel = null;
    var boardElement = null;
    var _pieceMap = {};
    var generateID = (function() {
      var base = Math.floor(Math.random() * Math.pow(10, 16));
      var count = 0;
      return function() {
        var hash = CryptoJS.SHA1(('0' + base + count).slice(-16) +
                                 Math.random().toString().substring(1));
        count += 1;
        return hash.toString();
      };
    }());
    var connectorSizeOffset = 21;
    function element(value) {
      mainPanel = value.mainPanel;
      boardElement = value.board;
    }
    function pageToLocal(point) {
      return {
        x: point.x - mainPanel.offsetLeft + mainPanel.scrollLeft,
        y: point.y + mainPanel.scrollTop
      };
    }
    function append(piece) {
      var pieceID = generateID();
      piece.id(pieceID);
      _pieceMap[pieceID] = piece;
      boardElement.appendChild(piece.element());
    }
    function remove(piece) {
      piece.destroy();
      boardElement.removeChild(piece.element());
      var pieceID = piece.id();
      delete _pieceMap[pieceID];
    }
    function pieceMap() {
      return _pieceMap;
    }
    function showAllPieceComponentBack() {
      for (var key in _pieceMap) {
        _pieceMap[key].showComponentBack();
      }
    }
    function hideAllPieceComponentBack() {
      for (var key in _pieceMap) {
        _pieceMap[key].hideComponentBack();
      }
    }
    function size() {
      var pieceMap = _pieceMap;
      var maxX = 0, maxY = 0;
      for (var key in pieceMap) {
        var pieceElement = pieceMap[key].element();
        var pieceX = pieceElement.offsetLeft + pieceElement.offsetWidth;
        if (pieceX > maxX)
          maxX = pieceX;
        var pieceY = pieceElement.offsetTop + pieceElement.offsetHeight;
        if (pieceY > maxY)
          maxY = pieceY;
      }
      maxX = Math.max(mainPanel.clientWidth, maxX + 45);
      maxY = Math.max(mainPanel.clientHeight, maxY + 3);
      return {
        width: maxX,
        height: maxY,
      };
    }
    function getInConnectorNotConnectedElements(type) {
      var nodes = mainPanel.querySelectorAll('.port-connector-in');
      var notConnectedElements = [];
      for (var i = 0, len = nodes.length; i < len; i += 1) {
        var node = nodes[i];
        var portElement = node.parentNode.parentNode;
        if (dom.hasClass(portElement, type) &&
            dom.hasClass(node.nextElementSibling, 'hide')) {
          notConnectedElements.push(node);
        }
      }
      return notConnectedElements;
    }
    function getPort(portID) {
      var idSet = portID.split('/');
      var pieceID = idSet[0];
      var piece = _pieceMap[pieceID];
      var portMap = piece.portMap();
      return portMap[idSet[1] + '/' + idSet[2]];
    }
    function showPortConnectorConnected(portID) {
      var port = getPort(portID);
      port.showConnectorConnected();
    }
    function hidePortConnectorConnected(portID) {
      var port = getPort(portID);
      port.hideConnectorConnected();
    }
    function getOutConnectorElement(portID) {
      var port = getPort(portID);
      return port.getOutConnectorElement();
    }
    var isFF = (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1);
    function getConnectorOffset(element) {
      var offsetX = 0, offsetY = 0, count = 0;
      while (element && element.id !== 'main_panel') {
        var elementStyle = getComputedStyle(element, null);
        offsetX = offsetX + element.offsetLeft -
                  parseInt(elementStyle.marginLeft || 0) +
                  parseInt(isFF ? 0 : (elementStyle.borderLeftWidth || 0));
        offsetY = offsetY + element.offsetTop -
                  parseInt(elementStyle.marginTop || 0) +
                  parseInt(isFF ? 0 : (elementStyle.borderTopWidth || 0));
        element = element.offsetParent;
        count += 1;
      }
      return {x: offsetX, y: offsetY};
    }
    function getConnectorPositionMap(pieceID) {
      var map = {};
      var piece = _pieceMap[pieceID];
      var portMap = piece.portMap();
      for (var portName in portMap) {
        var port = portMap[portName];
        var outConnectorOffset = getConnectorOffset(port.getOutConnectorElement());
        map[pieceID + '/' + portName + '/out'] = {
          x: outConnectorOffset.x + connectorSizeOffset,
          y: outConnectorOffset.y + connectorSizeOffset
        };
        var inConnectorOffset = getConnectorOffset(port.getInConnectorElement());
        map[pieceID + '/' + portName + '/in'] = {
          x: inConnectorOffset.x + connectorSizeOffset - (isFF ? 0 : 4),
          y: inConnectorOffset.y + connectorSizeOffset - (isFF ? 0 : 4)
        };
      }
      return map;
    }
    function getConnectorSizeOffset() {
      return connectorSizeOffset;
    }
    function isLoading() {
      return (document.querySelectorAll('.piece.loading').length !== 0);
    }
    function clientWidth() {
      return mainPanel.clientWidth;
    }
    function resetTouchScroll() {
      if (dom.supportsTouch()) {
        mainPanel.style.cssText = '-webkit-overflow-scrolling: auto;';
        setTimeout(function() {
          mainPanel.style.cssText = '';
        }, 0);
      }
    }
    return {
      element: element,
      pageToLocal: pageToLocal,
      append: append,
      remove: remove,
      pieceMap: pieceMap,
      showAllPieceComponentBack: showAllPieceComponentBack,
      hideAllPieceComponentBack: hideAllPieceComponentBack,
      size: size,
      getInConnectorNotConnectedElements: getInConnectorNotConnectedElements,
      showPortConnectorConnected: showPortConnectorConnected,
      hidePortConnectorConnected: hidePortConnectorConnected,
      getOutConnectorElement: getOutConnectorElement,
      getConnectorOffset: getConnectorOffset,
      getConnectorPositionMap: getConnectorPositionMap,
      getConnectorSizeOffset: getConnectorSizeOffset,
      isLoading: isLoading,
      clientWidth: clientWidth,
      resetTouchScroll: resetTouchScroll
    };
  }());

  var boardEvent = (function() {
    var isTouchEnabled = dom.supportsTouch();
    var START = dom.eventType.START;
    var isLoadingURLHash = false;
    function createPorts(propData, eventData) {
      var ports = [], key, item, p;
      if (propData) {
        for (key in propData) {
          item = propData[key];
          p = port.create('prop', key, item.label,
                          (item['in'] === true), (item.out === true),
                          (item['default'] === true));
          ports.push(p);
        }
      }
      if (eventData) {
        for (key in eventData) {
          item = eventData[key];
          p = port.create('event', key, item.label,
                          (item['in'] === true), (item.out === true),
                          (item['default'] === true));
          ports.push(p);
        }
      }
      return ports;
    }
    function getPieceFromChildNode(childNode) {
      if (childNode.tagName.toLowerCase() === 'option')
        return null;
      while (childNode) {
        childNode = childNode.parentNode;
        if (childNode && childNode.className === 'piece'){
          var pieceMap = board.pieceMap();
          return pieceMap[childNode.getAttribute('data-piece-id')];
        }
      }
      return null;
    }
    var propDataCache = (function() {
      var cache = {};
      var serializeTargets = {};
      function set(pieceID, target, data) {
        if (!(pieceID in cache))
          cache[pieceID] = {};
        cache[pieceID][target] = data;
      }
      function get(pieceID, target) {
        if (pieceID in cache && target in cache[pieceID])
          return cache[pieceID][target];
        else
          return null;
      }
      function remove(pieceID) {
        delete cache[pieceID];
        delete serializeTargets[pieceID];
      }
      function setSerializeTarget(pieceID, target) {
        if (!(pieceID in serializeTargets))
          serializeTargets[pieceID] = [];
        serializeTargets[pieceID].push(target);
      }
      function serialize() {
        var data = [];
        for (var pieceID in serializeTargets) {
          var targets = serializeTargets[pieceID];
          for (var i = 0, len = targets.length; i < len; i += 1) {
            data.push({
              pieceID: pieceID,
              target: targets[i],
              data: cache[pieceID][targets[i]]
            });
          }
        }
        return data;
      }
      return {
        set: set,
        get: get,
        remove: remove,
        setSerializeTarget: setSerializeTarget,
        serialize: serialize
      };
    }());
    function dispatchBoardEvent(event) {
      var eventType = event.type;
      if (eventType === 'connect' || eventType === 'disconnect') {
        var targetPortIDSet = event.targetPortID.split('/');
        var pieceID = targetPortIDSet[0];
        var type = targetPortIDSet[1];
        if (type === 'event')
          return;
        var target = targetPortIDSet[2];
        var data;
        var isConnected;
        if (eventType === 'connect') {
          var sourcePortIDSet = event.sourcePortID.split('/');
          data = propDataCache.get(sourcePortIDSet[0], sourcePortIDSet[2]);
          isConnected = true;
        } else if (eventType === 'disconnect') {
          data = null;
          isConnected = false;
        }
        postMessageToPiece(pieceID, type, target, data, isConnected);
      }
    }
    function postMessageToPiece(pieceID, type, target, data, isConnected) {
      var sendData = {
        type: type,
        target: target
      };
      if (type === 'prop')
        sendData.data = data;
      sendData.isConnected = isConnected;
      var piece = board.pieceMap()[pieceID];
      if (piece) {
        var frame = piece.getComponentElement();
        frame.contentWindow.postMessage(JSON.stringify(sendData), '*');
      }
    }
    function flushConnection(sourcePortID, targetPortID) {
      var sourcePort = getPort(sourcePortID);
      var targetPort = getPort(targetPortID);
      var sourceID = sourcePortID + '/out';
      var targetID = targetPortID + '/in';
      sourcePort.setFlushOutConnector(true);
      targetPort.setFlushInConnector(true);
      targetPort.setFlushConnectorConnected(true);
      pathContainer.setFlushPath(sourceID, targetID, true);
      setTimeout(function() {
        sourcePort.setFlushOutConnector(false);
        targetPort.setFlushInConnector(false);
        targetPort.setFlushConnectorConnected(false);
        pathContainer.setFlushPath(sourceID, targetID, false);
      }, 160);
    }
    function printLog(message) {
      if (window.console && typeof console.warn === 'function')
        console.warn(message);
    }
    var updateURLHash = (function() {
      function mapConnection(connection, pieceIDMap) {
        var sourceIDSet = connection.sourceID.split('/');
        var targetIDSet = connection.targetID.split('/');
        return {
          source: pieceIDMap[sourceIDSet[0]] + '/' + sourceIDSet[1] + '/' + sourceIDSet[2],
          target: pieceIDMap[targetIDSet[0]] + '/' + targetIDSet[1] + '/' + targetIDSet[2]
        };
      }
      return lib.util.debounce(function() {
        if (isLoadingURLHash)
          return;
        var pieceMap = board.pieceMap();
        var pieceIDMap = {};
        var count = 0;
        var pieces = [];
        for (var pieceID in pieceMap) {
          var pieceAttr = pieceMap[pieceID].getAttribute();
          pieceAttr.id = count;
          pieceIDMap[pieceID] = count;
          pieces[count] = pieceAttr;
          count += 1;
        }
        var connections = pathContainer.getConnectionList();
        for (var i = 0, len = connections.length; i < len; i += 1) {
          connections[i] = mapConnection(connections[i], pieceIDMap);
        }
        var cacheDataList = propDataCache.serialize();
        for (var i = 0, len = cacheDataList.length; i < len; i += 1) {
          var pieceID = cacheDataList[i].pieceID;
          cacheDataList[i].id = pieceIDMap[pieceID];
          delete cacheDataList[i].pieceID;
        }
        var hashText = '';
        if (pieces.length > 0) {
          hashText = Base64.encodeURI(JSON.stringify({
            node: pieces,
            link: connections,
            data: cacheDataList
          }));
        }
        location.replace('index.html#' + hashText);
        var urlLen = location.href.length;
        if (urlLen > 2083)
          printLog('Too long URL(' + urlLen + ' words)');
      }, 100);
    }());
    function createAndAppendPiece(attr) {
      var p = piece.create(attr.src);
      p.position({x: attr.x, y: attr.y});
      p.updatePosition();
      board.append(p);
      return p.id();
    }
    function createAndAppendConnection(connection, pieceIDMap) {
      if (connection.target === 'drag')
        return;
      var sourceSet = connection.source.split('/');
      var sourcePortID = pieceIDMap[sourceSet[0]] + '/' + sourceSet[1] + '/' + sourceSet[2];
      var targetSet = connection.target.split('/');
      var targetPortID = pieceIDMap[targetSet[0]] + '/' + targetSet[1] + '/' + targetSet[2];
      connectPort(sourcePortID, targetPortID);
    }
    function loadURLHash() {
      isLoadingURLHash = true;
      var hashText = location.hash.substring(1);
      if (hashText) {
        try {
          var data = JSON.parse(Base64.decode(hashText));
        } catch (e) {
          if (window.console && typeof console.error === 'function')
            console.error(e);
          isLoadingURLHash = false;
          return;
        }
        var pieces = data.node;
        var pieceIDMap = {};
        for (var i = 0, len = pieces.length; i < len; i += 1) {
          var pieceAttr = pieces[i];
          var pieceID = createAndAppendPiece(pieceAttr);
          pieceIDMap[pieceAttr.id] = pieceID;
        }
        var retryCount = 0;
        setTimeout(function waitLoadPiece() {
          if (!board.isLoading()) {
            var cacheDataList = data.data;
            for (var i = 0, len = cacheDataList.length; i < len; i += 1) {
              var cacheData = cacheDataList[i];
              var pieceID = pieceIDMap[cacheData.id];
              postMessageToPiece(pieceID, 'prop', cacheData.target, cacheData.data, false);
            }
            var connections = data.link;
            for (var i = 0, len = connections.length; i < len; i += 1) {
              var connection = connections[i];
              createAndAppendConnection(connection, pieceIDMap);
            }
            pathContainer.size(board.size());
            isLoadingURLHash = false;
          } else {
            if (retryCount < 100) {
              setTimeout(waitLoadPiece, 100);
              retryCount += 1;
            } else {
              location.replace('index.html#' + hashText);
              printLog('Load time out');
              isLoadingURLHash = false;
            }
          }
        }, 100);
      } else {
        location.replace('index.html#');
        isLoadingURLHash = false;
      }
    }
    function setWindowResizeListener() {
      window.addEventListener('resize', lib.util.debounce(function() {
        pathContainer.size(board.size());
      }, 1000 / 60));
    }
    function setWindowMessageListener() {
      window.addEventListener('message', function(event) {
        try {
          var eventData = JSON.parse(event.data);
        } catch (e) {
          return;
        }
        var pieceID = eventData.id;
        var piece = board.pieceMap()[pieceID];
        if (typeof piece === 'undefined')
          return;
        var data = eventData.data;
        var type = eventData.type;
        var target = eventData.target;
        switch (type) {
          case 'load':
            if (!piece.isLoading())
              return;
            piece.label(data.label);
            piece.componentHeight(data.componentHeight);
            var ports = createPorts(data.prop, data.event);
            piece.setPorts(ports);
            piece.vitalize();
            var propData = data.prop;
            for (var target in propData) {
              if ('data' in propData[target])
                propDataCache.set(pieceID, target, propData[target].data);
              if (propData[target].serialize === true)
                propDataCache.setSerializeTarget(pieceID, target);
            }
            break;
          case 'prop':
            propDataCache.set(pieceID, target, data);
            var targetIDs = pathContainer.getTargetIDs(pieceID + '/prop/' + target + '/out');
            for (var i = 0, len = targetIDs.length; i < len; i += 1) {
              var targetID = targetIDs[i];
              if (targetID === 'drag')
                continue;
              var targetIDSet = targetID.split('/');
              var pieceID = targetIDSet[0];
              var target = targetIDSet[2];
              postMessageToPiece(pieceID, 'prop', target, data, true);
            }
            break;
          case 'event':
            var sourcePortID = pieceID + '/event/' + target;
            var targetIDs = pathContainer.getTargetIDs(sourcePortID + '/out');
            for (var i = 0, len = targetIDs.length; i < len; i += 1) {
              var targetID = targetIDs[i];
              if (targetID === 'drag')
                continue;
              var targetIDSet = targetID.split('/');
              var pieceID = targetIDSet[0];
              var target = targetIDSet[2];
              postMessageToPiece(pieceID, 'event', target, null, true);
              var targetPortID = targetID.replace(/\/in$/, '');
              flushConnection(sourcePortID, targetPortID);
            }
            break;
          default:
            break;
        }
        updateURLHash();
      }, false);
    }
    function setMainPanelStartListener(mainPanelElement) {
      mainPanelElement.addEventListener(START, function(event) {
        var target = event.target;
        if (dom.hasClass(target, 'loading'))
          return;
        var className = event.target.className.toString().split(' ')[0];
        var piece = getPieceFromChildNode(target);
        if (piece) {
          piece.toFront();
          piece.updatePosition();
          if (document.activeElement && document.activeElement.blur)
            document.activeElement.blur();
        }
        switch (className) {
          case 'port-content-delete-button':
            hidePort(event);
            break;
          case 'piece-header-delete-button':
            removePiece(event);
            break;
          case 'piece-header-title':
            dragPiece(event);
            break;
          case 'port-content-text':
            sortPort(event);
            break;
          case 'port-connector-out':
            dragPortConnectorOut(event);
            break;
          case 'port-connector-connected':
            dragPortConnectorOut(event, true);
            break;
          default:
            break;
        }
      }, false);
    }
    function element(elementMap) {
      setWindowResizeListener();
      setWindowMessageListener();
      setMainPanelStartListener(elementMap.mainPanel);
    }
    function showPort(event) {
      var portIDSet = event.target.value.split('/');
      var pieceID = portIDSet[0];
      var piece = board.pieceMap()[pieceID];
      var portMap = piece.portMap();
      var portName = portIDSet[1] + '/' + portIDSet[2];
      piece.showPort(portMap[portName]);
    }
    function getPort(portID) {
      var portIDSet = portID.split('/');
      var pieceID = portIDSet[0];
      var piece = board.pieceMap()[pieceID];
      var portMap = piece.portMap();
      var portName = portIDSet[1] + '/' + portIDSet[2];
      return portMap[portName];
    }
    function connectPort(sourcePortID, targetPortID) {
      if (sourcePortID === null || targetPortID === null)
        return;
      var pieceMap = board.pieceMap();
      var sourcePieceID = sourcePortID.split('/')[0];
      var targetPieceID = targetPortID.split('/')[0];
      var sourcePiece = pieceMap[sourcePieceID];
      var targetPiece = pieceMap[targetPieceID];
      var sourcePort = getPort(sourcePortID);
      var targetPort = getPort(targetPortID);
      sourcePiece.showPort(sourcePort);
      targetPiece.showPort(targetPort);
      targetPort.showConnectorConnected();
      pathContainer.append(sourcePortID + '/out', targetPortID + '/in');
      updatePathPosition(sourcePieceID);
      updatePathPosition(targetPieceID);
      pathContainer.updatePosition();
      dispatchBoardEvent({
        type: 'connect',
        sourcePortID: sourcePortID,
        targetPortID: targetPortID
      });
    }
    function disconnectPort(sourcePortID, targetPortID) {
      if (sourcePortID === null || targetPortID === null)
        return;
      var targetPort = getPort(targetPortID);
      targetPort.hideConnectorConnected();
      pathContainer.remove(sourcePortID, targetPortID);
      dispatchBoardEvent({
        type: 'disconnect',
        sourcePortID: sourcePortID.replace(/\/out$/, ''),
        targetPortID: targetPortID.replace(/\/in$/, '')
      });
    }
    function removePortConnection(portID) {
      var sourcePortID = portID + '/out';
      var sourceTargetIDs = pathContainer.getTargetIDs(sourcePortID);
      for (var i = 0, len = sourceTargetIDs.length; i < len; i += 1) {
        disconnectPort(sourcePortID, sourceTargetIDs[i]);
      }
      var targetPortID = portID + '/in';
      disconnectPort(pathContainer.getSourceID(targetPortID), targetPortID);
    }
    var hidePort = (function() {
      function tapListener(event) {
        var portID = event.target.parentNode.parentNode.getAttribute('data-port-id');
        var portIDSet = portID.split('/');
        var pieceID = portIDSet[0];
        var piece = board.pieceMap()[pieceID];
        var portMap = piece.portMap();
        var portName = portIDSet[1] + '/' + portIDSet[2];
        piece.hidePort(portMap[portName]);
        removePortConnection(portID);
        updatePathPosition(pieceID);
        pathContainer.updatePosition();
        pathContainer.refreshPosition();
      }
      return function(event) {
        dom.startTapEvent(event, {
          tap: function() {
            tapListener(event);
          }
        });
      };
    }());
    function removePiece(event) {
      var pieceID = event.target.parentNode.parentNode.getAttribute('data-piece-id');
      var piece = board.pieceMap()[pieceID];
      if (isTouchEnabled)
        piece.addClassOfHeader('delete');
      dom.startTapEvent(event, {
        tap: function() {
          board.remove(piece);
          propDataCache.remove(pieceID);
          if (isTouchEnabled)
            piece.removeClassOfHeader('delete');
          updateURLHash();
          pathContainer.size(board.size());
        },
        cancel: function() {
          if (isTouchEnabled)
            piece.removeClassOfHeader('delete');
        }
      });
    }
    function updatePathPosition(pieceID) {
      var connectorPositionMap = board.getConnectorPositionMap(pieceID);
      for (var connectorID in connectorPositionMap) {
        pathContainer.position(connectorID, connectorPositionMap[connectorID]);
      }
    }
    function dragPiece(event) {
      var pieceID = event.target.parentNode.parentNode.getAttribute('data-piece-id');
      var piece = board.pieceMap()[pieceID];
      var piecePosition = piece.position();
      var startX = piecePosition.x;
      var startY = piecePosition.y;
      var isDragging = true;
      function updatePiecePosition() {
        if (isDragging) {
          dom.requestAnimationFrame(updatePiecePosition);
          piece.updatePosition();
          pathContainer.updatePosition();
        }
      }
      dom.startDragEvent(event, {
        drag: function(dx, dy) {
          piece.position({x: startX + dx, y: startY + dy});
          updatePathPosition(pieceID);
        },
        end: function(dx, dy) {
          board.hideAllPieceComponentBack();
          pathContainer.size(board.size());
          isDragging = false;
          dom.requestAnimationFrame(function() {
            piece.position({x: startX + dx, y: startY + dy});
            piece.updatePosition();
            updatePathPosition(pieceID);
            pathContainer.updatePosition();
            pathContainer.refreshPosition();
          });
          if (isTouchEnabled)
            piece.removeClassOfHeader('drag');
          updateURLHash();
        }
      });
      board.showAllPieceComponentBack();
      dom.requestAnimationFrame(updatePiecePosition);
      if (isTouchEnabled)
        piece.addClassOfHeader('drag');
    }
    function sortPort(event) {
      var portElement = event.target.parentNode.parentNode;
      var portListElement = portElement.parentNode;
      var portID = portElement.getAttribute('data-port-id');
      var placeholderElement = portElement.cloneNode();
      var index = dom.indexOf(portListElement, portElement);
      var portElementHeight = 46;
      var startY = portElementHeight * index;
      var maxY = portElementHeight * (portListElement.children.length - 1);
      var isDragging = true;
      var portTop;
      var portListElementChildren;
      var prePlaceholderIndex;
      var pieceID = portID.split('/')[0];
      function updatePortPosition() {
        if (isDragging) {
          dom.requestAnimationFrame(updatePortPosition);
          portElement.style.cssText = dom.makeCSSText({top: portTop + 'px'});
          pathContainer.updatePosition();
        }
      }
      dom.startDragEvent(event, {
        drag: function(dx, dy) {
          if (isDragging)
            dom.requestAnimationFrame(updatePortPosition);
          var top = startY + dy;
          if (top < 0)
            top = 0;
          if (top > maxY)
            top = maxY;
          portTop = top;
          var moveIndex = parseInt((portTop - startY) / portElementHeight + ((dy > 0) ? 0.5 : -0.5));
          var placeholderIndex = index + moveIndex + (moveIndex >= 0 ? 1 : 0);
          if (prePlaceholderIndex !== placeholderIndex) {
            portListElement.insertBefore(placeholderElement, portListElementChildren[placeholderIndex] || null);
            prePlaceholderIndex = placeholderIndex;
          }
          updatePathPosition(pieceID);
        },
        end: function(dx, dy) {
          board.hideAllPieceComponentBack();
          isDragging = false;
          dom.requestAnimationFrame(function() {
            portElement.style.cssText = '';
            portListElement.insertBefore(portElement, placeholderElement);
            dom.removeClass(portElement, 'drag');
            portListElement.removeChild(placeholderElement);
            updatePathPosition(pieceID);
            pathContainer.updatePosition();
            pathContainer.refreshPosition();
          });
        }
      });
      board.showAllPieceComponentBack();
      dom.addClass(placeholderElement, 'placeholder');
      dom.addClass(portElement, 'drag');
      portListElement.insertBefore(placeholderElement, portElement.nextSibling);
      portListElementChildren = portListElement.querySelectorAll('.port:not(.drag)');
    }
    var dragPortConnectorOut = (function() {
      var hasClass = dom.hasClass;
      var connectorSizeOffset = board.getConnectorSizeOffset();
      var getConnectorOffset = board.getConnectorOffset;
      var isFF = (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1);
      function getInConnectorPositionMap(type) {
        var inConnectorElements = board.getInConnectorNotConnectedElements(type);
        var map = {};
        for (var i = 0, len = inConnectorElements.length; i < len; i += 1) {
          var element = inConnectorElements[i];
          var portID = element.parentNode.parentNode.getAttribute('data-port-id');
          var offset = getConnectorOffset(inConnectorElements[i]);
          offset.x += connectorSizeOffset - (isFF ? 0 : 4);
          offset.y += connectorSizeOffset - (isFF ? 0 : 4);
          map[portID] = offset;
        }
        return map;
      }
      function getInConnectorPositionMapForSearch(positionMap) {
        var map = {};
        for (var portID in positionMap) {
          var offset = positionMap[portID];
          var x = offset.x, y = offset.y;
          if (!(x in map))
            map[x] = {};
          map[x][y] = portID;
        }
        return map;
      }
      function abs(n) {
        return n > 0 ? n : -n;
      }
      function getIntersectConnector(searchMap, point) {
        var pointX = point.x, pointY = point.y;
        for (var x in searchMap) {
          if (abs(pointX - x) < connectorSizeOffset) {
            var searchMapForY = searchMap[x];
            for (var y in searchMapForY) {
              if (abs(pointY - y) < connectorSizeOffset) {
                return {
                  portID: searchMapForY[y],
                  point: {x: x, y: y}
                };
              }
            }
          }
        }
        return null;
      }
      function getPortType(portElement) {
        if (dom.hasClass(portElement, 'prop'))
          return 'prop';
        else if (dom.hasClass(portElement, 'event'))
          return 'event';
      }
      return function(event, isConnected) {
        var target = event.target;
        var connectorOutElement;
        if (isConnected) {
          var portID = target.parentNode.parentNode.getAttribute('data-port-id');
          var sourceID = pathContainer.getSourceID(portID + '/in');
          var outConnectorElement = board.getOutConnectorElement(sourceID.replace(/\/out/, ''));
          connectorOutElement = outConnectorElement;
        } else {
          connectorOutElement = target;
        }
        if (hasClass(connectorOutElement, 'drag'))
          return;
        var connectorOffset = getConnectorOffset(connectorOutElement);
        var portElement = connectorOutElement.parentNode.parentNode;
        var portID = portElement.getAttribute('data-port-id');
        var connectorPoint = {
          x: connectorOffset.x + connectorSizeOffset,
          y: connectorOffset.y + connectorSizeOffset
        };
        var targetOffset = getConnectorOffset(target);
        var targetPoint = {
          x: targetOffset.x + connectorSizeOffset,
          y: targetOffset.y + connectorSizeOffset
        };
        var positionMap = getInConnectorPositionMap(getPortType(portElement));
        if (isConnected) {
          var connectedPortID = target.parentNode.parentNode.getAttribute('data-port-id');
          positionMap[connectedPortID] = targetPoint;
        }
        var positionSearchMap = getInConnectorPositionMapForSearch(positionMap);
        var currentPathSourceID;
        var currentPathTargetID;
        var isDragging = true;
        function updatePortConnector() {
          if (isDragging) {
            connectorHandle.update();
            pathContainer.updatePosition();
          }
        }
        function startConnectorHandle() {
          connectorHandle.position(connectorOffset);
          connectorHandle.update();
          if (hasClass(portElement, 'prop'))
            connectorHandle.type('prop');
          else if (hasClass(portElement, 'event'))
            connectorHandle.type('event');
        }
        dom.startDragEvent(event, {
          drag: function(dx, dy) {
            if (isDragging)
              dom.requestAnimationFrame(updatePortConnector);
            connectorHandle.position({
              x: targetOffset.x + dx,
              y: targetOffset.y + dy,
            });
            var dragPoint = {
              x: targetPoint.x + dx,
              y: targetPoint.y + dy
            };
            var interSectConnector = getIntersectConnector(positionSearchMap, dragPoint);
            var currentPortID = currentPathTargetID.replace(/\/in$/, '');
            if (interSectConnector !== null) {
              var targetID = interSectConnector.portID + '/in';
              if (targetID !== currentPathTargetID) {
                var prePathTargetID = currentPathTargetID;
                pathContainer.change([currentPathSourceID, currentPathTargetID],
                                   [currentPathSourceID, targetID]);
                currentPathTargetID = targetID;
                pathContainer.position(targetID, interSectConnector.point);
                connectorHandle.hide();
                board.showPortConnectorConnected(interSectConnector.portID);
                if (currentPortID !== 'drag') {
                  board.hidePortConnectorConnected(currentPortID);
                  var prePathTargetPortID = prePathTargetID.replace(/\/in$/, '');
                  dispatchBoardEvent({
                    type: 'disconnect',
                    sourcePortID: currentPathSourceID.replace(/\/out$/, ''),
                    targetPortID: prePathTargetPortID
                  });
                  if (isTouchEnabled)
                    getPort(prePathTargetPortID).clearMark();
                }
                var currentPathTargetPortID = currentPathTargetID.replace(/\/in$/, '');
                dispatchBoardEvent({
                  type: 'connect',
                  sourcePortID: currentPathSourceID.replace(/\/out$/, ''),
                  targetPortID: currentPathTargetPortID
                });
                if (isTouchEnabled)
                  getPort(currentPathTargetPortID).mark();
              }
            } else {
              var targetID = 'drag';
              if (targetID !== currentPathTargetID) {
                var prePathTargetID = currentPathTargetID;
                pathContainer.change([currentPathSourceID, currentPathTargetID],
                                     [currentPathSourceID, targetID]);
                currentPathTargetID = targetID;
                if (currentPortID !== 'drag')
                  board.hidePortConnectorConnected(currentPortID);
                connectorHandle.show();
                var prePathTargetPortID = prePathTargetID.replace(/\/in$/, '');
                dispatchBoardEvent({
                  type: 'disconnect',
                  sourcePortID: currentPathSourceID.replace(/\/out$/, ''),
                  targetPortID: prePathTargetPortID
                });
                if (isTouchEnabled)
                  getPort(prePathTargetPortID).clearMark();
              }
              pathContainer.position(targetID, dragPoint);
            }
          },
          end: function(dx, dy) {
            board.hideAllPieceComponentBack();
            isDragging = false;
            dom.requestAnimationFrame(function() {
              connectorHandle.hide();
              connectorHandle.position({
                x: -connectorSizeOffset * 2,
                y: -connectorSizeOffset * 2
              });
              connectorHandle.update();
              pathContainer.remove(currentPathSourceID, 'drag');
              pathContainer.refreshPosition();
              dom.setCursor('default');
            });
            if (isTouchEnabled) {
              getPort(portID).clearMark();
              if (currentPathTargetID !== 'drag') {
                var currentPathTargetPortID = currentPathTargetID.replace(/\/in$/, '');
                getPort(currentPathTargetPortID).clearMark();
              }
            }
            updateURLHash();
          }
        });
        board.showAllPieceComponentBack();
        startConnectorHandle();
        currentPathSourceID = portID + '/out';
        if (isConnected) {
          currentPathTargetID = connectedPortID + '/in';
          connectorHandle.hide();
        } else {
          currentPathTargetID = 'drag';
          connectorHandle.show();
        }
        pathContainer.append(currentPathSourceID, currentPathTargetID);
        pathContainer.position(currentPathSourceID, connectorPoint);
        pathContainer.position(currentPathTargetID, targetPoint);
        pathContainer.updatePosition();
        if (isTouchEnabled) {
          dom.requestAnimationFrame(function() {
            getPort(portID).mark();
            if (isConnected)
              getPort(connectedPortID).mark();
          });
        }
        dom.setCursor('crosshair');
      };
    }());
    return {
      element: element,
      showPort: showPort,
      removePortConnection: removePortConnection,
      loadURLHash: loadURLHash
    };
  }());

  var piece = (function() {
    var zIndexCount = 0;
    var addClass = dom.addClass;
    var removeClass = dom.removeClass;
    function create(src) {
      var p = Object.create(this);
      var elementMap = nodeTemplate.createPiece(src);
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

  var port = (function() {
    var addClass = dom.addClass;
    var removeClass = dom.removeClass;
    function create(type, key, contentText, hasIn, hasOut, isDefault) {
      var p = Object.create(this);
      var elementMap = nodeTemplate.createPort(type, contentText, hasIn, hasOut);
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


  // application
  function initialize() {
    if (!dom.supportsSVG()) {
      alert('Sorry, your browser doesn\'t support this application.');
      return;
    }

    var element = dom.getElement();

    // sideView
    sideView.element({
      sidePanel: element.sidePanel,
      divider: element.divider,
      dividerIcon: element.dividerIcon,
      mainPanel: element.mainPanel
    });
    var sideViewState = dom.loadData('side-view-state') || 'open';
    sideView[sideViewState]();
    sideView.on('change', function(event) {
      dom.saveData('side-view-state', event.state);
      pathContainer.size(board.size());
      board.resetTouchScroll();
    });

    // searchInputView
    searchInputView.element(element.searchInput);
    searchInputView.on('input', lib.util.debounce(sideView.updatePieceListView, 1000 / 60));

    // nodeTemplate
    nodeTemplate.element({
      pieceListItemTemplate: element.pieceListItemTemplate,
      pieceTemplate: element.pieceTemplate,
      portTemplate: element.portTemplate
    });

    // pieceListView
    pieceListView.element(element.pieceList);
    pieceListView.on('dragend', function(event) {
      var localPoint = board.pageToLocal({x: event.pageX, y: event.pageY});
      if (localPoint.x >= 0 && localPoint.y >= 0) {
        var p = piece.create(event.pieceSrc);
        p.label(event.pieceLabel);
        p.position(localPoint);
        p.updatePosition();
        board.append(p);
        recentryUsedPieceList.add({src: event.pieceSrc});
        sideView.updatePieceListView();
      }
    });

    // pieceList
    pieceList.load(dom.loadData('piece-lists'), function() {
      recentryUsedPieceList.update();
      sideView.updatePieceListView();
    });

    // pieceListManager
    pieceListManager.element({
      button: element.pieceListManagerButton
    });

    // drag connector handle
    connectorHandle.element({
      mainPanel: element.mainPanel
    });

    // path container
    pathContainer.element(element.pathContainer);

    // board
    board.element({
      mainPanel: element.mainPanel,
      board: element.board
    });

    // board event
    boardEvent.element({
      mainPanel: element.mainPanel,
      board: element.board
    });
    boardEvent.loadURLHash();

  }

  initialize();

}(this));