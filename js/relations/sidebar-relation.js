(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');

  var SidebarRelation = helper.inherits(function(props) {
    SidebarRelation.super_.call(this);

    this.header = props.header;
    this.content = props.content;
    this.moduleDataSearcher = props.moduleDataSearcher;
  }, jCore.Relation);

  SidebarRelation.prototype.update = function() {
    var moduleDatas = this.moduleDataSearcher(this.header.searchText());
    var content = this.content;
    content.clear();
    moduleDatas.forEach(function(moduleData) {
      content.appendModule({
        title: moduleData.label,
        content: moduleData.description,
        name: moduleData.key(),
      });
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarRelation;
  } else {
    app.SidebarRelation = SidebarRelation;
  }
})(this.app || (this.app = {}));
