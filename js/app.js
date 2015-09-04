(function(app) {
  'use strict';
  var m = require('mithril');
  var SidePanelController = app.SidePanelController || require('./controllers/side-panel-controller.js');
  var MainPanelController = app.MainPanelController || require('./controllers/main-panel-controller.js');
  var sidePanelView = app.sidePanelView || require('./views/side-panel-view.js');
  var mainPanelView = app.mainPanelView || require('./views/main-panel-view.js');

  var controller = function() {
    var sidePanelController = new SidePanelController();
    var mainPanelController = new MainPanelController();

    sidePanelController.ondragend = function(event) {
      mainPanelController.addPiece(event.pageX, event.pageY, event.pieceLabel, event.pieceSrc);
    };

    sidePanelController.loadPieceList('piecelist/default.json');

    this.sidePanelController = sidePanelController;
    this.mainPanelController = mainPanelController;
  };

  var view = function(ctrl) {
    return [
      sidePanelView(ctrl.sidePanelController),
      mainPanelView(ctrl.mainPanelController)
    ];
  };

  m.mount(document.getElementById('container'), {
    controller: controller,
    view: view
  });
})(this.app || (this.app = {}));