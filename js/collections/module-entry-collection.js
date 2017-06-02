(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var ModuleEntry = app.ModuleEntry || require('../models/module-entry.js');

  var ModuleEntryCollection = function() {
    this.data = {};
  };

  ModuleEntryCollection.prototype.packageNamesUrl = function() {
    return 'modular_modules/index.json';
  };

  ModuleEntryCollection.prototype.moduleEntriesUrl = function(packageName) {
    return [
      'modular_modules/',
      packageName.split('/').map(function(s) {
        return encodeURIComponent(s);
      }).join('/'),
      '/index.json',
    ].join('');
  };

  ModuleEntryCollection.prototype.load = function() {
    return this.loadPackageNames().then(function(packageNames) {
      return Promise.all(packageNames.map(function(packageName) {
        return this.loadModuleEntries(packageName).then(function(moduleEntries) {
          moduleEntries.forEach(function(moduleEntry) {
            this.data[moduleEntry.key()] = moduleEntry;
          }.bind(this));
        }.bind(this));
      }.bind(this)));
    }.bind(this));
  };

  ModuleEntryCollection.prototype.loadPackageNames = function() {
    return dom.ajax({
      type: 'GET',
      url: this.packageNamesUrl(),
    }).then(function(text) {
      return JSON.parse(text);
    });
  };

  ModuleEntryCollection.prototype.loadModuleEntries = function(packageName) {
    return dom.ajax({
      type: 'GET',
      url: this.moduleEntriesUrl(packageName),
    }).then(function(text) {
      return JSON.parse(text).map(function(props) {
        return new ModuleEntry(helper.extend(props, { packageName: packageName }));
      });
    });
  };

  ModuleEntryCollection.prototype.get = function(key) {
    return this.data[key] || null;
  };

  ModuleEntryCollection.prototype.search = function(keyword) {
    return helper.sortBy(helper.values(this.data).filter(function(moduleEntry) {
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
