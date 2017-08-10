(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Collection = app.Collection || require('./collection.js');
  var Entry = app.Entry || require('../models/entry.js');

  var EntryCollection = Collection.inherits(function(props) {
    this.jsonLoader = props.jsonLoader;
  });

  EntryCollection.prototype.packageNamesUrl = function() {
    return 'modular_modules/index.json';
  };

  EntryCollection.prototype.entriesUrl = function(packageName) {
    return 'modular_modules/' + helper.encodePath(packageName) + '/index.json';
  };

  EntryCollection.prototype.load = function() {
    return this.loadPackageNames().then(function(packageNames) {
      return Promise.all(packageNames.map(function(packageName) {
        return this.loadEntries(packageName);
      }.bind(this))).then(function(results) {
        this.data = helper.flatten(results);
      }.bind(this));
    }.bind(this));
  };

  EntryCollection.prototype.loadPackageNames = function() {
    return this.jsonLoader(this.packageNamesUrl());
  };

  EntryCollection.prototype.loadEntries = function(packageName) {
    return this.jsonLoader(this.entriesUrl(packageName)).then(function(data) {
      return data.map(function(props) {
        var name = packageName + '/' + props.src;
        return new Entry(helper.extend(props, { name: name }));
      });
    });
  };

  EntryCollection.prototype.get = function(name) {
    return helper.findLast(this.data, function(entry) {
      return (entry.name === name);
    });
  };

  EntryCollection.prototype.search = function(keyword) {
    return helper.sortBy(this.data.filter(function(entry) {
      return (entry.keywordScore(keyword) !== 0);
    }), function(entry) {
      // sort in descending order
      return -(entry.keywordScore(keyword));
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntryCollection;
  } else {
    app.EntryCollection = EntryCollection;
  }
})(this.app || (this.app = {}));