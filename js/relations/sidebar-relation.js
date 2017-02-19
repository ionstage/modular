(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var SidebarRelation = helper.inherits(function(props) {
    SidebarRelation.super_.call(this);

    this.header = props.header;
    this.content = props.content;
    this.moduleEntrySearcher = props.moduleEntrySearcher;
  }, jCore.Relation);

  SidebarRelation.prototype.update = function() {
    var moduleEntries = this.moduleEntrySearcher(this.header.searchText());
    var content = this.content;
    content.clear();
    moduleEntries.forEach(function(moduleEntry) {
      content.appendModule({
        title: moduleEntry.label,
        content: moduleEntry.description,
        name: moduleEntry.key(),
      });
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarRelation;
  } else {
    app.SidebarRelation = SidebarRelation;
  }
})(this.app || (this.app = {}));
