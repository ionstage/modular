(function(app) {
  'use strict';

  var circuit = require('circuit');
  var helper = app.helper || require('../helper.js');
  var Wrapper = helper.wrapper();

  var CircuitModule = function(members, options) {
    this.members = members;
    return this.wrapper(options);
  };

  CircuitModule.prototype.get = function(name) {
    return helper.findLast(this.members, function(member) {
      return (member.name === name);
    });
  };

  CircuitModule.prototype.getAll = function() {
    return this.members.slice();
  };

  CircuitModule.prototype.wrapper = function(options) {
    return {
      get: this.get.bind(this),
      getAll: this.getAll.bind(this),
      options: options,
    };
  };

  CircuitModule.bind = function(sourceMember, targetMember) {
    var source = sourceMember.unwrap(Wrapper.KEY).callee;
    var target = targetMember.unwrap(Wrapper.KEY).callee;
    circuit.bind(source, target);
  };

  CircuitModule.unbind = function(sourceMember, targetMember) {
    var source = sourceMember.unwrap(Wrapper.KEY).callee;
    var target = targetMember.unwrap(Wrapper.KEY).callee;
    circuit.unbind(source, target);
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

  CircuitModule.ModularModule = function(members, options) {
    return new CircuitModule(members.map(function(member) {
      return new CircuitModule.Member({
        label: member.label,
        name: member.name,
        type: member.type,
        arg: (Object.prototype.hasOwnProperty.call(member, 'arg') ? member.arg : void 0),
        plugDisabled: !!member.plugDisabled,
        socketDisabled: !!member.socketDisabled,
      });
    }), options || {});
  };

  CircuitModule.modular = function() {
    return Object.create(Object.prototype, {
      Module: { value: CircuitModule.ModularModule },
      exports: { value: null, writable: true },
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitModule;
  } else {
    app.CircuitModule = CircuitModule;
  }
})(this.app || (this.app = {}));
