(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');

  var Component = helper.inherits(function(props) {
    Component.super_.call(this);

    var element = props.element || this.render();
    var parentElement = props.parentElement || (element ? dom.parent(element) : null);

    this.element = this.prop(element);
    this.parentElement = this.prop(parentElement);
    this.cache = {};
    this.listeners = {};
  }, jCore.Component);

  Component.prototype.childElement = function(selector) {
    return dom.find(this.element(), selector);
  };

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

  Component.prototype.on = function(type, listener) {
    if (!this.listeners.hasOwnProperty(type)) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  };

  Component.prototype.emit = function() {
    var args = helper.toArray(arguments);
    var type = args.shift();
    if (this.listeners.hasOwnProperty(type)) {
      this.listeners[type].forEach(function(listener) {
        listener.apply(this, args);
      }.bind(this));
    }
  };

  Component.prototype.removeAllListeners = function(type) {
    if (this.listeners.hasOwnProperty(type)) {
      delete this.listeners[type];
    } else {
      this.listeners = {};
    }
  };

  Component.prototype.redrawBy = function() {
    var args = helper.toArray(arguments);
    var callback = args.pop();

    if (this.needsUpdate(args)) {
      callback.apply(this, this.values(args));
      this.updateCache(args);
    }
  };

  Component.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    this.onredraw();

    if (parentElement && parentElement !== dom.parent(element)) {
      this.onappend();
      dom.append(parentElement, element);
    } else if (!parentElement && dom.parent(element)) {
      this.onremove();
      dom.remove(element);
      this.clearCache();
      this.removeAllListeners();
    }
  };

  Component.prototype.render = function() {
    return dom.render('<div></div>');
  };

  Component.prototype.oninit = function() {};

  Component.prototype.onappend = function() {};

  Component.prototype.onremove = function() {};

  Component.prototype.onredraw = function() {};

  Component.inherits = function(initializer) {
    var superCtor = this;
    var ctor = helper.inherits(function() {
      var props = (arguments.length !== 0 ? arguments[0] : {});
      superCtor.call(this, props);
      if (typeof initializer === 'function') {
        initializer.call(this, props);
      }
      if (this.constructor === ctor) {
        this.oninit();
      }
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
