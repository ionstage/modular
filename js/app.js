(function() {
  'use strict';
  function initialize() {
    var element = dom.getElement();

    // sideView
    sideView.element({
      sidePanel: element.sidePanel,
      divider: element.divider,
      dividerIcon: element.dividerIcon,
      mainPanel: element.mainPanel
    });
    sideView.open();
    sideView.on('change', function(event) {
      pathContainer.size(board.size());
      board.resetTouchScroll();
    });

    // searchInputView
    searchInputView.element(element.searchInput);
    searchInputView.on('input', lib.util.debounce(sideView.updatePieceListView, 1000 / 60));

    // template
    pieceListView.template(element.pieceListItemTemplate);
    piece.template(element.pieceTemplate);
    port.template(element.portTemplate);

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
      }
    });

    // pieceList
    pieceList.load(['piecelist/default.json']);

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
})();