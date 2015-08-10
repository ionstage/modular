(function(app) {
  'use strict';
  var m = require('mithril');
  var SidePanelController = app.SidePanelController || require('./controllers/side-panel-controller.js');
  var sidePanelView = app.sidePanelView || require('./views/side-panel-view.js');

  var controller = function() {
    var sidePanelController = new SidePanelController();

    sidePanelController.ondragend = function(event) {
      var localPoint = board.pageToLocal({x: event.pageX, y: event.pageY});

      if (localPoint.x < 0 || localPoint.y < 0)
        return;

      var p = piece.create(event.pieceSrc);
      p.label(event.pieceLabel);
      p.position(localPoint);
      p.updatePosition();
      board.append(p);
    };

    sidePanelController.loadPieceList('piecelist/default.json');

    this.sidePanelController = sidePanelController;
  };

  var view = function(ctrl) {
    return [
      sidePanelView(ctrl.sidePanelController),
      m('#main_panel', {
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          var pieceTemplateElement = dom.el('#piece_template');
          var portTemplateElement = dom.el('#port_template');
          var pathContainerElement = dom.el('#path_container');
          var boardElement = dom.el('#board');

          // template
          piece.template(pieceTemplateElement);
          port.template(portTemplateElement);

          // drag connector handle
          connectorHandle.element({
            mainPanel: element
          });

          // path container
          pathContainer.element(pathContainerElement);

          // board
          board.element({
            mainPanel: element,
            board: boardElement
          });

          // board event
          boardEvent.element({
            mainPanel: element,
            board: boardElement
          });
          boardEvent.loadURLHash();
        }
      }, [
        m('svg#path_container'),
        m('#board')
      ])
    ];
  };

  m.mount(dom.el('#container'), {
    controller: controller,
    view: view
  });
})(this.app || (this.app = {}));