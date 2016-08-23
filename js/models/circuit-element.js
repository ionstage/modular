(function(app) {
  'use strict';

  var circuit = require('circuit');

  var Wrapper = function(obj, self) {
    obj.unwrap = Wrapper.unwrap.bind(self);
    return obj;
  };

  Wrapper.unwrap = function(key) {
    if (key === Wrapper.KEY)
      return this;
  };

  Wrapper.KEY = {};

  var CircuitElementMember = function(props) {
    this.label = props.label;
    this.name = props.name;
    this.type = props.type;
    this.callee = circuit[props.type](props.arg);
    this.socketDisabled = !!props.socketDisabled;
    this.plugDisabled = !!props.plugDisabled;
    this.wrapper = new Wrapper(CircuitElementMember.prototype.call.bind(this), this);
    this.wrapper.props = CircuitElementMember.prototype.props.bind(this);
  };

  CircuitElementMember.prototype.call = function() {
    return this.callee.apply(null, arguments);
  };

  CircuitElementMember.prototype.props = function() {
    return {
      label: this.label,
      name: this.name,
      type: this.type,
      socketDisabled: this.socketDisabled,
      plugDisabled: this.plugDisabled
    };
  };

  var CircuitElement = function(members) {
    var memberTable = {};
    var names = [];

    members.slice().reverse().forEach(function(props) {
      var name = props.name;

      if (name in memberTable)
        return;

      memberTable[name] = new CircuitElementMember(props);
      names.unshift(name);
    });

    this.memberTable = memberTable;
    this.names = names;

    return this.wrapper();
  };

  CircuitElement.prototype.get = function(name) {
    var member = this.memberTable[name];

    if (!member)
      return null;

    return member.wrapper;
  };

  CircuitElement.prototype.getAll = function() {
    return this.names.map(function(name) {
      return this.memberTable[name].wrapper;
    }.bind(this));
  };

  CircuitElement.prototype.wrapper = function() {
    return {
      get: CircuitElement.prototype.get.bind(this),
      getAll: CircuitElement.prototype.getAll.bind(this)
    };
  };

  CircuitElement.bind = function(sourceWrapper, targetWrapper) {
    var sourceMember = sourceWrapper.unwrap(Wrapper.KEY);
    var targetMember = targetWrapper.unwrap(Wrapper.KEY);
    circuit.bind(sourceMember.callee, targetMember.callee);
  };

  CircuitElement.unbind = function(sourceWrapper, targetWrapper) {
    var sourceMember = sourceWrapper.unwrap(Wrapper.KEY);
    var targetMember = targetWrapper.unwrap(Wrapper.KEY);
    circuit.unbind(sourceMember.callee, targetMember.callee);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CircuitElement;
  else
    app.CircuitElement = CircuitElement;
})(this.app || (this.app = {}));
