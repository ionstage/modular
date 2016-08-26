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

    return this.wrapper();
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

  CircuitElementMember.prototype.wrapper = function() {
    var wrapper = new Wrapper(CircuitElementMember.prototype.call.bind(this), this);
    wrapper.props = CircuitElementMember.prototype.props.bind(this);
    return wrapper;
  };

  var CircuitElement = function(members) {
    var memberTable = {};
    var memberNames = [];

    members.slice().reverse().forEach(function(props) {
      var name = props.name;
      if (!(name in memberTable)) {
        memberTable[name] = new CircuitElementMember(props);
        memberNames.unshift(name);
      }
    });

    this.memberTable = memberTable;
    this.memberNames = memberNames;

    return this.wrapper();
  };

  CircuitElement.prototype.get = function(memberName) {
    return this.memberTable[memberName];
  };

  CircuitElement.prototype.getAll = function() {
    return this.memberNames.map(function(memberName) {
      return this.get(memberName);
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
