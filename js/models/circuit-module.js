(function(app) {
  'use strict';

  var circuit = require('circuit');
  var helper = app.helper || require('../helper.js');
  var Wrapper = helper.wrapper();

  var CircuitModule = function(members) {
    this.members = members;
    return this.wrapper();
  };

  CircuitModule.prototype.get = function(name) {
    return helper.findLast(this.members, function(member) {
      return (member.name === name);
    });
  };

  CircuitModule.prototype.getAll = function() {
    return this.members.slice();
  };

  CircuitModule.prototype.wrapper = function() {
    return {
      get: this.get.bind(this),
      getAll: this.getAll.bind(this),
    };
  };

  CircuitModule.bind = function(source, target) {
    var sourceCallee = source.unwrap(Wrapper.KEY).callee;
    var targetCallee = target.unwrap(Wrapper.KEY).callee;
    circuit.bind(sourceCallee, targetCallee);
  };

  CircuitModule.unbind = function(source, target) {
    var sourceCallee = source.unwrap(Wrapper.KEY).callee;
    var targetCallee = target.unwrap(Wrapper.KEY).callee;
    circuit.unbind(sourceCallee, targetCallee);
  };

  CircuitModule.Member = (function() {
    var Member = function(props) {
      this.callee = circuit[props.type](props.arg);
      return this.wrapper(helper.omit(props, ['arg']));
    };

    Member.prototype.call = function() {
      return this.callee.apply(null, arguments);
    };

    Member.prototype.wrapper = function(props) {
      var wrapper = new Wrapper(this, this.call.bind(this));
      return Object.keys(props).reduce(function(wrapper, key) {
        return Object.defineProperty(wrapper, key, {
          value: props[key],
          enumerable: true,
        });
      }, wrapper);
    };

    return Member;
  })();

  CircuitModule.ModularModule = function(members) {
    return new CircuitModule(members.map(function(member) {
      return new CircuitModule.Member({
        label: member.label,
        name: member.name,
        type: member.type,
        arg: (member.hasOwnProperty('arg') ? member.arg : void 0),
        plugDisabled: !!member.plugDisabled,
        socketDisabled: !!member.socketDisabled,
      });
    }));
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitModule;
  } else {
    app.CircuitModule = CircuitModule;
  }
})(this.app || (this.app = {}));
