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

  Component.prototype.redrawBy = function() {
    var args = helper.toArray(arguments);
    var callback = args.pop();

    if (this.needsUpdate(args)) {
      callback.apply(this, this.values(args));
      this.updateCache(args);
    }
  };

  Component.prototype.redrawDOMDataBy = function(key, dataName) {
    this.redrawBy(key, function(value) {
      dom.data(this.element(), dataName, value);
    });
  };

  Component.prototype.redrawDOMTextBy = function(key) {
    this.redrawBy(key, function(value) {
      dom.text(this.element(), value);
    });
  };

  Component.prototype.redrawDOMToggleClassBy = function(key, className) {
    this.redrawBy(key, function(value) {
      dom.toggleClass(this.element(), className, value);
    });
  };

  Component.prototype.redrawDOMTranslateYBy = function(key) {
    this.redrawBy(key, function(value) {
      dom.translateY(this.element(), value);
    });
  };

  Component.prototype.redrawDOMValueBy = function(key) {
    this.redrawBy(key, function(value) {
      dom.value(this.element(), value);
    });
  };

  Component.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();

    this.onredraw();

    if (parentElement && parentElement !== dom.parent(element)) {
      this.onappend();
      dom.append(parentElement, element);
      return;
    }

    if (!parentElement && dom.parent(element)) {
      this.onremove();
      dom.remove(element);
      this.clearCache();
      return;
    }
  };

  Component.prototype.render = function() {
    return dom.render('<div></div>');
  };

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
