(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Component = function() {
    this.relations = this.prop([]);
  };

  Component.prototype.prop = function(initialValue, defaultValue, converter) {
    if (typeof converter !== 'function')
      converter = helper.identity;

    var cache = converter(initialValue, defaultValue);

    return function(value) {
      if (typeof value === 'undefined')
        return cache;

      if (value === cache)
        return;

      cache = converter(value, cache);

      this.markDirty();
    };
  };

  Component.prototype.redraw = function() {};

  Component.prototype.markDirty = (function() {
    var dirtyComponents = [];
    var requestId = null;

    var updateRelations = function(index) {
      for (var i = index, len = dirtyComponents.length; i < len; i++) {
        var component = dirtyComponents[i];
        component.relations().forEach(function(relation) {
          relation.update(component);
        });
      }

      // may be inserted other dirty components by updating relations
      if (dirtyComponents.length > len)
        updateRelations(len);
    };

    var callback = function() {
      updateRelations(0);

      dirtyComponents.forEach(function(component) {
        component.redraw();
      });

      dirtyComponents = [];
      requestId = null;
    };

    return function() {
      if (dom.unsupported())
        return;

      if (dirtyComponents.indexOf(this) === -1)
        dirtyComponents.push(this);

      if (requestId !== null)
        return;

      requestId = dom.animate(callback);
    };
  })();

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Component;
  else
    app.Component = Component;
})(this.app || (this.app = {}));