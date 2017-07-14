(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Component = helper.inherits(function(props) {
    Component.super_.call(this);

    var element = props.element || null;
    var parentElement = props.parentElement || (element ? dom.parent(element) : null);

    this.element = this.prop(element);
    this.parentElement = this.prop(parentElement);
    this.cache = {};
  }, jCore.Component);

  Component.prototype.needsUpdate = function(keys) {
    return keys.some(function(key) {
      return !helper.equal(this[key](), this.cache[key]);
    }.bind(this));
  };

  Component.prototype.values = function(keys) {
    return keys.map(function(key) {
      return this[key]();
    }.bind(this))
  };

  Component.prototype.updateCache = function(keys) {
    keys.forEach(function(key) {
      this.cache[key] = this[key]();
    }.bind(this));
  };

  Component.prototype.clearCache = function() {
    this.cache = {};
  };

  Component.prototype.addRelation = function(relation) {
    this.relations().push(relation);
  };

  Component.prototype.removeRelation = function(relation) {
    helper.remove(this.relations(), relation);
  };

  Component.prototype.redrawProp = function() {
    var args = helper.toArray(arguments);
    var callback = args.pop();

    if (this.needsUpdate(args)) {
      callback.apply(this, this.values(args));
      this.updateCache(args);
    }
  };

  Component.prototype.redrawData = function(key, dataName) {
    this.redrawProp(key, function(value) {
      dom.data(this.element(), dataName, value);
    });
  };

  Component.prototype.redrawToggleClass = function(key, className) {
    this.redrawProp(key, function(value) {
      dom.toggleClass(this.element(), className, value);
    });
  };

  Component.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    if (!parentElement && !element) {
      return;
    }

    if (parentElement && !element) {
      this.element(this.render());
      this.redraw();
      this.onappend();
      dom.append(parentElement, this.element());
      return;
    }

    if (!parentElement && element) {
      this.onremove();
      dom.remove(element);
      this.element(null);
      this.clearCache();
      return;
    }

    this.onredraw();
  };

  Component.prototype.render = function() {
    return dom.render('<div></div>');
  };

  Component.prototype.onappend = function() {};

  Component.prototype.onremove = function() {};

  Component.prototype.onredraw = function() {};

  Component.inherits = function(initializer) {
    var superCtor = this;
    var ctor = helper.inherits(function(props) {
      superCtor.call(this, props);
      initializer.call(this, props);
    }, superCtor);
    ctor.inherits = superCtor.inherits;
    return ctor;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Component;
  } else {
    app.Component = Component;
  }
})(this.app || (this.app = {}));
