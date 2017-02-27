(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');
  var Content = app.Content || require('./content.js');
  var Sidebar = app.Sidebar || require('./sidebar.js');

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

  var ModuleEntryCollection = function() {
    this.data = {};
  };

  ModuleEntryCollection.prototype.packageNamesUrl = function() {
    return 'modular_modules/index.json';
  };

  ModuleEntryCollection.prototype.moduleEntriesUrl = function(packageName) {
    return 'modular_modules/' + packageName + '/index.json';
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
        return new ModuleEntry(helper.extend(helper.clone(props), { packageName: packageName }));
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

  var Body = helper.inherits(function() {
    Body.super_.call(this, { element: dom.body() });

    this.moduleEntryCollection = this.prop(new ModuleEntryCollection());
    this.dragCount = this.prop(0);

    this.content = new Content({
      element: dom.el('.content'),
      sidebarCollapser: Body.prototype.sidebarCollapser.bind(this),
      sidebarExpander: Body.prototype.sidebarExpander.bind(this),
      moduleDragStarter: Body.prototype.moduleDragStarter.bind(this),
      moduleDragEnder: Body.prototype.moduleDragEnder.bind(this),
    });

    this.sidebar = new Sidebar({
      element: dom.el('.sidebar'),
      moduleDragStarter: Body.prototype.moduleDragStarter.bind(this),
      moduleDragEnder: Body.prototype.moduleDragEnder.bind(this),
      moduleDropper: Body.prototype.moduleDropper.bind(this),
      moduleEntrySearcher: Body.prototype.moduleEntrySearcher.bind(this),
    });

    dom.ready(Body.prototype.onready.bind(this));
  }, Component);

  Body.prototype.incrementDragCount = function() {
    this.dragCount(this.dragCount() + 1);
  };

  Body.prototype.decrementDragCount = function() {
    this.dragCount(this.dragCount() - 1);
  };

  Body.prototype.redraw = function() {
    this.redrawDragCount();
  };

  Body.prototype.redrawDragCount = function() {
    var dragCount = this.dragCount();
    var cache = this.cache();

    if (dragCount === cache.dragCount) {
      return;
    }

    dom.toggleClass(this.element(), 'module-dragging', dragCount > 0);
    cache.dragCount = dragCount;
  };

  Body.prototype.onready = function() {
    this.content.redraw();
    this.moduleEntryCollection().load().then(function() {
      this.sidebar.searchEnabled(true);
    }.bind(this));
  };

  Body.prototype.sidebarCollapser = function() {
    return dom.transition(this.element(), function() {
      dom.addClass(this.element(), 'no-sidebar');
    }.bind(this));
  };

  Body.prototype.sidebarExpander = function() {
    return dom.transition(this.element(), function() {
      dom.removeClass(this.element(), 'no-sidebar');
    }.bind(this));
  };

  Body.prototype.moduleDragStarter = function() {
    this.incrementDragCount();
  };

  Body.prototype.moduleDragEnder = function() {
    this.decrementDragCount();
  };

  Body.prototype.moduleDropper = function(name, x, y) {
    var moduleEntry = this.moduleEntryCollection().get(name);
    this.content.loadModuleByClientPosition({
      title: moduleEntry.label,
      name: name,
      x: x,
      y: y,
    }, moduleEntry.visiblePortNames);
  };

  Body.prototype.moduleEntrySearcher = function(searchText) {
    return this.moduleEntryCollection().search(searchText);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Body;
  } else {
    app.Body = Body;
  }
})(this.app || (this.app = {}));
