(function(app) {
  'use strict';
  var m = require('mithril');
  var ConnectorHandle = app.ConnectorHandle || require('../components/connector-handle.js');

  var boardView = function() {
    return [
      m('svg#path_container'),
      m('#board'),
      m('.port-connector-out.drag.hide', {
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          boardEvent.setConnectorHandle(new ConnectorHandle(element));
        }
      })
    ];
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = boardView;
  else
    app.boardView = boardView;
})(this.app || (this.app = {}));