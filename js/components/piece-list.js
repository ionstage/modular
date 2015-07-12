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