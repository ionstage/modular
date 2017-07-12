(function(app) {
  'use strict';

  var circuit = require('circuit');
  var helper = app.helper || require('../helper.js');
  var Wrapper = helper.wrapper();

  var CircuitElement = function(members) {
    this.members = members;
    return this.wrapper();
  };

  CircuitElement.prototype.get = function(name) {
    return helper.findLast(this.members, function(member) {
      return (member.name === name);
    });
  };

  CircuitElement.prototype.getAll = function() {
    return this.members.slice();
  };

  CircuitElement.prototype.wrapper = function() {
    return {
      get: CircuitElement.prototype.get.bind(this),
      getAll: CircuitElement.prototype.getAll.bind(this),
    };
  };

  CircuitElement.bind = function(source, target) {
    var sourceCallee = source.unwrap(Wrapper.KEY).callee;
    var targetCallee = target.unwrap(Wrapper.KEY).callee;
    circuit.bind(sourceCallee, targetCallee);
  };

  CircuitElement.unbind = function(source, target) {
    var sourceCallee = source.unwrap(Wrapper.KEY).callee;
    var targetCallee = target.unwrap(Wrapper.KEY).callee;
    circuit.unbind(sourceCallee, targetCallee);
  };

  CircuitElement.Member = (function() {
    var Member = function(props) {
      this.callee = circuit[props.type](props.arg);
      return this.wrapper(helper.extend(this.defaults(), props));
    };

    Member.prototype.defaults = function() {
      return {
        socketDisabled: false,
        plugDisabled: false,
      };
    };

    Member.prototype.call = function() {
      return this.callee.apply(null, arguments);
    };

    Member.prototype.wrapper = function(props) {
      var wrapper = new Wrapper(this, Member.prototype.call.bind(this));
      Member.KEYS.forEach(function(key) {
        helper.define(wrapper, key, props[key], { enumerable: true });
      });
      return wrapper;
    };

    Member.KEYS = ['label', 'name', 'type', 'socketDisabled', 'plugDisabled'];

    return Member;
  })();

  CircuitElement.ModularModule = (function() {
    var ModularModule = function(members) {
      return new CircuitElement(members.map(function(member) {
        return new CircuitElement.Member(member);
      }));
    };

    ModularModule.export = function(obj) {
      helper.define(obj, 'ModularModule', ModularModule);
    };

    return ModularModule;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitElement;
  } else {
    app.CircuitElement = CircuitElement;
  }
})(this.app || (this.app = {}));
