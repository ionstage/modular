(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Collection = app.Collection || require('./collection.js');
  var ModuleEntry = app.ModuleEntry || require('../models/module-entry.js');

  var ModuleEntryCollection = Collection.inherits();

  ModuleEntryCollection.prototype.packageNamesUrl = function() {
    return 'modular_modules/index.json';
  };

  ModuleEntryCollection.prototype.moduleEntriesUrl = function(packageName) {
    return 'modular_modules/' + helper.encodePath(packageName) + '/index.json';
  };

  ModuleEntryCollection.prototype.load = function() {
    return this.loadPackageNames().then(function(packageNames) {
      return Promise.all(packageNames.map(function(packageName) {
        return this.loadModuleEntries(packageName);
      }.bind(this))).then(function(results) {
        this.data = helper.flatten(results);
      }.bind(this));
    }.bind(this));
  };

  ModuleEntryCollection.prototype.loadPackageNames = function() {
    return dom.loadJSON(this.packageNamesUrl());
  };

  ModuleEntryCollection.prototype.loadModuleEntries = function(packageName) {
    return dom.loadJSON(this.moduleEntriesUrl(packageName)).then(function(data) {
      return data.map(function(props) {
        var name = packageName + '/' + props.src;
        return new ModuleEntry(helper.extend(props, { name: name }));
      });
    });
  };

  ModuleEntryCollection.prototype.get = function(name) {
    return helper.findLast(this.data, function(moduleEntry) {
      return (moduleEntry.name === name);
    });
  };

  ModuleEntryCollection.prototype.search = function(keyword) {
    return helper.sortBy(this.data.filter(function(moduleEntry) {
      return (moduleEntry.keywordScore(keyword) !== 0);
    }), function(moduleEntry) {
      // sort in descending order
      return -(moduleEntry.keywordScore(keyword));
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleEntryCollection;
  } else {
    app.ModuleEntryCollection = ModuleEntryCollection;
  }
})(this.app || (this.app = {}));
