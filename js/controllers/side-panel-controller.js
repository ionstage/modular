(function(app) {
  'use strict';
  var m = require('mithril');

  var SidePanelController = function() {
    var noop = function() {};
    this.state = m.prop(SidePanelController.STATE_OPEN);
    this.pieceList = m.prop([]);
    this.searchKeyword = m.prop('');
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

    var pieceList = this.pieceList();

    var labelMatchList = [];
    var tagMatchList = [];
    var labelMatchListSub = [];
    var descriptionMatchList = [];

    keyword = keyword.toLowerCase();

    pieceList.forEach(function(item) {
      var label = item.label.toLowerCase();
      var description = item.description.toLowerCase();

      if (label.indexOf(keyword) === 0)
        labelMatchList.push(item);
      else if (isMatchTag(item.tag, keyword))
        tagMatchList.push(item);
      else if (keyword.length >= 2 && label.indexOf(keyword) !== -1)
        labelMatchListSub.push(item);
      else if (keyword.length >= 2 && description.indexOf(keyword) !== -1)
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
    return tagList.some(function(tag) {
      return tag.toLowerCase().indexOf(keyword) !== -1;
    });
  };

  SidePanelController.STATE_OPEN = 'open';
  SidePanelController.STATE_CLOSE = 'close';

  if (typeof module !== 'undefined' && module.exports)
    module.exports = SidePanelController;
  else
    app.SidePanelController = SidePanelController;
})(this.app || (this.app = {}));