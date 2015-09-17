(function(app) {
  'use strict';
  var m = require('mithril');
  var SidePanelComponent = app.SidePanelComponent || require('./components/side-panel-component.js');
  var MainPanelController = app.MainPanelController || require('./controllers/main-panel-controller.js');
  var mainPanelView = app.mainPanelView || require('./views/main-panel-view.js');

  var controller = function() {
    this.mainPanelController = new MainPanelController();
  };

  var view = function(ctrl) {
    var mainPanelController = ctrl.mainPanelController;
    return [
      m.component(SidePanelComponent, {
        ondragend: function(event) {
          mainPanelController.addPiece(event.pageX, event.pageY, event.pieceLabel, event.pieceSrc);
        }
      }),
      mainPanelView(mainPanelController)
    ];
  };

  m.mount(document.getElementById('container'), {
    controller: controller,
    view: view
  });
})(this.app || (this.app = {}));