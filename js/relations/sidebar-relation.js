(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var SidebarRelation = helper.inherits(function(props) {
    this.header = props.header;
    this.content = props.content;
    this.moduleEntrySearcher = props.moduleEntrySearcher;
  }, jCore.Relation);

  SidebarRelation.prototype.set = function() {
    this.header.addRelation(this);
  };

  SidebarRelation.prototype.moduleEntries = function() {
    return this.moduleEntrySearcher(this.header.searchText());
  };

  SidebarRelation.prototype.update = function() {
    this.content.setModules(this.moduleEntries());
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarRelation;
  } else {
    app.SidebarRelation = SidebarRelation;
  }
})(this.app || (this.app = {}));
