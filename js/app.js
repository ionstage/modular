(function(app) {
  'use strict';
  var m = require('mithril');
  var SidePanelController = app.SidePanelController || require('./controllers/side-panel-controller.js');
  var sidePanelView = app.sidePanelView || require('./views/side-panel-view.js');

  function initialize() {
    var element = dom.getElement();

    var sideViewComponent = {
      controller: function() {
        var ctrl = new SidePanelController();

        ctrl.ontoggle = function() {
          pathContainer.size(board.size());
          board.resetTouchScroll();
        };

        ctrl.ondragend = function(event) {
          var localPoint = board.pageToLocal({x: event.pageX, y: event.pageY});

          if (localPoint.x < 0 || localPoint.y < 0)
            return;

          var p = piece.create(event.pieceSrc);
          p.label(event.pieceLabel);
          p.position(localPoint);
          p.updatePosition();
          board.append(p);
        };

        ctrl.loadPieceList('piecelist/default.json');

        return ctrl;
      },
      view: sidePanelView
    };

    m.mount(element.sidePanelContainer, sideViewComponent);

    // template
    piece.template(element.pieceTemplate);
    port.template(element.portTemplate);

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
})(this.app || (this.app = {}));