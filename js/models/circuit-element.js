(function(app) {
  'use strict';

  var circuit = require('circuit');
  var helper = app.helper || require('../helper.js');

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
    this.callee = circuit[props.type](props.arg);
    return this.wrapper(helper.extend(this.defaults(), helper.pick(props, CircuitElementMember.keys)));
  };

  CircuitElementMember.prototype.defaults = function() {
    return {
      socketDisabled: false,
      plugDisabled: false
    };
  };

  CircuitElementMember.prototype.call = function() {
    return this.callee.apply(null, arguments);
  };

  CircuitElementMember.prototype.wrapper = function(props) {
    var wrapper = new Wrapper(CircuitElementMember.prototype.call.bind(this), this);
    wrapper.props = helper.clone.bind(null, props);
    return wrapper;
  };

  CircuitElementMember.keys = ['label', 'name', 'type', 'socketDisabled', 'plugDisabled'];

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
