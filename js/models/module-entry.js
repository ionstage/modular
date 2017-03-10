(function(app) {
  'use strict';

  var ModuleEntry = function(props) {
    this.packageName = props.packageName || '';
    this.label = props.label || '';
    this.description = props.description || '';
    this.src = props.src || '';
    this.visiblePortNames = props.visiblePortNames || [];
    this.tags = props.tags || [];
  };

  ModuleEntry.prototype.key = function() {
    return this.packageName + '/' + this.src;
  };

  ModuleEntry.prototype.keywordScore = function(keyword) {
    if (!keyword) {
      return 0;
    }

    keyword = keyword.toLowerCase();

    var label = this.label.toLowerCase();
    if (label.indexOf(keyword) === 0) {
      return 1;
    }

    var tags = this.tags;
    for (var i = 0, len = tags.length; i < len; i++) {
      var tag = tags[i].toLowerCase();
      if (tag.indexOf(keyword) !== -1) {
        return 0.75;
      }
    }

    if (keyword.length < 2) {
      return 0;
    }

    if (label.indexOf(keyword) !== -1) {
      return 0.5;
    }

    var description = this.description.toLowerCase();
    if (description.indexOf(keyword) !== -1) {
      return 0.25;
    }

    return 0;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleEntry;
  } else {
    app.ModuleEntry = ModuleEntry;
  }
})(this.app || (this.app = {}));