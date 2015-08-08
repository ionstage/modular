(function(app) {
  'use strict';
  var m = require('mithril');

  var SidePanelController = function() {
    var noop = function() {};
    this.state = m.prop(SidePanelController.STATE_OPEN);
    this.pieceList = m.prop([]);
    this.searchKeyword = m.prop('');
    this.ontoggle = noop;
    this.ondragend = noop;
  };

  SidePanelController.prototype.loadPieceList = function(pieceListUrl) {
    m.request({
      method: 'GET',
      url: pieceListUrl
    }).then(this.pieceList);
  };

  SidePanelController.prototype.searchPieceList = function(keyword) {
    if (!keyword)
      return [];

    var list = this.pieceList();

    var labelMatchList = [];
    var tagMatchList = [];
    var labelMatchListSub = [];
    var descriptionMatchList = [];

    keyword = keyword.toLowerCase();

    list.forEach(function(item) {
      if (item.label.toLowerCase().indexOf(keyword) === 0)
        labelMatchList.push(item);
      else if (isMatchTag(item.tag, keyword))
        tagMatchList.push(item);
      else if (keyword.length >= 2 && item.label.toLowerCase().indexOf(keyword) !== -1)
        labelMatchListSub.push(item);
      else if (keyword.length >= 2 && item.description.toLowerCase().indexOf(keyword) !== -1)
        descriptionMatchList.push(item);
    });

    return labelMatchList.concat(tagMatchList, labelMatchListSub, descriptionMatchList);
  };

  SidePanelController.prototype.dispatchEvent = function(event) {
    var state = this.state();
    switch (event.type) {
    case 'toggle':
      if (state === SidePanelController.STATE_OPEN)
        this.state(SidePanelController.STATE_CLOSE);
      else if (state === SidePanelController.STATE_CLOSE)
        this.state(SidePanelController.STATE_OPEN);
      m.redraw();
      this.ontoggle();
      break;
    case 'searchkeywordchange':
      this.searchKeyword(event.value);
      m.redraw();
      break;
    case 'dragend':
      this.ondragend(event);
      break;
    default:
      break;
    }
  };

  var isMatchTag = function(tagList, keyword) {
    for (var i = 0, len = tagList.length; i < len; i++) {
      if (tagList[i].toLowerCase().indexOf(keyword) !== -1)
        return true;
    }
    return false;
  };

  SidePanelController.STATE_OPEN = 'open';
  SidePanelController.STATE_CLOSE = 'close';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = SidePanelController;
  else
    app.SidePanelController = SidePanelController;
})(this.app || (this.app = {}));