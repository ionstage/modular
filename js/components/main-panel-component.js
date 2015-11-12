(function(app) {
  'use strict';
  var m = require('mithril');
  var BoardComponent = app.BoardComponent || require('./board-component.js');
  var boardEvent = app.boardEvent || require('./board-event.js');

  var MainPanelController = function(args) {
    if (!(this instanceof MainPanelController))
      return new MainPanelController(args);

    this.element = m.prop(null);
    args.addPiece = this.addPiece.bind(this);
  };

  MainPanelController.prototype.addPiece = function(pageX, pageY, label, src) {
    var element = this.element();

    if (!element)
      return;

    var x = pageX - element.offsetLeft + element.scrollLeft;
    var y = pageY + element.scrollTop;

    if (x < 0 || y < 0)
      return;

    boardEvent.addPiece(x, y, label, src);
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

  var mainPanelView = function(ctrl) {
    return m('#main_panel', {
      config: mainPanelConfig.bind(ctrl)
    }, [
      m.component(BoardComponent),
      m('.retainer', {
        config: retainerConfig.bind(ctrl)
      })
    ]);
  };

  var mainPanelConfig = function(element, isInitialized) {
    if (isInitialized)
      return;

    var ctrl = this;

    ctrl.dispatchEvent({
      type: 'init',
      element: element
    });

    // board event
    boardEvent.initialize(element);
    boardEvent.loadURLHash();
  };

  var retainerConfig = function(element, isInitialized) {
    if (!isInitialized)
      return;

    var ctrl = this;

    var mainPanelElement = ctrl.element();

    var scrollLeft = mainPanelElement.scrollLeft;
    var scrollTop = mainPanelElement.scrollTop;

    dom.addClass(element, 'hide');

    var clientWidth = mainPanelElement.clientWidth;
    var clientHeight = mainPanelElement.clientHeight;
    var scrollWidth = mainPanelElement.scrollWidth;
    var scrollHeight = mainPanelElement.scrollHeight;
    if (scrollWidth > clientWidth || scrollHeight > clientHeight) {
      var x = scrollWidth + (scrollWidth > clientWidth ? 46 : -1);
      var y = scrollHeight + (scrollHeight > clientHeight ? 46 : -1);
      dom.translate(element, x, y);
      dom.removeClass(element, 'hide');
      mainPanelElement.scrollLeft = scrollLeft;
      mainPanelElement.scrollTop = scrollTop;
    }
  };

  var MainPanelComponent = {
    controller: MainPanelController,
    view: mainPanelView
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = MainPanelComponent;
  else
    app.MainPanelComponent = MainPanelComponent;
})(this.app || (this.app = {}));