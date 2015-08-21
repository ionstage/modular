(function(app) {
  'use strict';
  var m = require('mithril');

  var MainPanelController = function() {
    this.element = m.prop(null);
  };

  MainPanelController.prototype.addPiece = function(pageX, pageY, label, src) {
    var element = this.element();

    if (!element)
      return;

    var localPoint = {
      x: pageX - element.offsetLeft + element.scrollLeft,
      y: pageY + element.scrollTop
    };

    if (localPoint.x < 0 || localPoint.y < 0)
      return;

    var p = piece.create(src);
    p.label(label);
    p.position(localPoint);
    p.updatePosition();
    board.append(p);
  };

  MainPanelController.prototype.dispatchEvent = function(event) {
    switch (event.type) {
    case 'init':
      this.element(event.element);
      break;
    default:
      break;
    }
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = MainPanelController;
  else
    app.MainPanelController = MainPanelController;
})(this.app || (this.app = {}));