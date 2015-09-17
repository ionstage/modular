(function(app) {
  'use strict';
  var m = require('mithril');
  var SidePanelComponent = app.SidePanelComponent || require('./components/side-panel-component.js');
  var MainPanelComponent = app.MainPanelComponent || require('./components/main-panel-component.js');

  var controller = function() {
    var noop = function() {};
    var panelEvent = this.panelEvent = {
      addPiece: noop,
      ondragend: function(event) {
        panelEvent.addPiece(event.pageX, event.pageY, event.pieceLabel, event.pieceSrc);
      }
    };
  };

  var view = function(ctrl) {
    return [
      m.component(SidePanelComponent, ctrl.panelEvent),
      m.component(MainPanelComponent, ctrl.panelEvent)
    ];
  };

  m.mount(document.getElementById('container'), {
    controller: controller,
    view: view
  });
})(this.app || (this.app = {}));