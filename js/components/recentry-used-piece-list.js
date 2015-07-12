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