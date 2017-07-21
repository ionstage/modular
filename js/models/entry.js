(function(app) {
  'use strict';

  var Entry = function(props) {
    this.name = props.name;
    this.label = props.label || '';
    this.description = props.description || '';
    this.src = props.src || '';
    this.visiblePortNames = props.visiblePortNames || [];
    this.tags = props.tags || [];
  };

  Entry.prototype.keywordScore = function(keyword) {
    if (!keyword) {
      return 0;
    }

    keyword = keyword.toLowerCase();

    var label = this.label.toLowerCase();
    var labelIndex = label.indexOf(keyword);
    if (labelIndex === 0) {
      return 1;
    }

    var tags = this.tags;
    for (var i = 0, len = tags.length; i < len; i++) {
      var tag = tags[i].toLowerCase();
      if (tag === keyword || (keyword.length >= 2 && tag.indexOf(keyword) !== -1)) {
        return 0.75;
      }
    }

    if (keyword.length < 2) {
      return 0;
    }

    if (labelIndex !== -1) {
      return 0.5;
    }

    var description = this.description.toLowerCase();
    if (description.indexOf(keyword) !== -1) {
      return 0.25;
    }

    return 0;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Entry;
  } else {
    app.Entry = Entry;
  }
})(this.app || (this.app = {}));
