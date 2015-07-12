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