(function(app) {
  'use strict';

  var circuit = require('circuit');
  var helper = app.helper || require('../helper.js');
  var Wrapper = helper.wrapper();

  var CircuitElement = helper.extend(function(members) {
    var memberTable = {};
    var memberNames = [];

    members.slice().reverse().forEach(function(props) {
      var name = props.name;
      if (!(name in memberTable)) {
        memberTable[name] = new CircuitElement.Member(props);
        memberNames.unshift(name);
      }
    });

    this.memberTable = memberTable;
    this.memberNames = memberNames;

    return this.wrapper();
  }, {
    Member: (function() {
      var Member = function(props) {
        this.callee = circuit[props.type](props.arg);
        return this.wrapper(helper.extend(this.defaults(), helper.pick(props, Member.KEYS)));
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
        var wrapper = new Wrapper(Member.prototype.call.bind(this), this);
        wrapper.props = helper.clone.bind(null, props);
        return wrapper;
      };

      Member.KEYS = ['label', 'name', 'type', 'socketDisabled', 'plugDisabled'];

      return Member;
    })(),
  });

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
      getAll: CircuitElement.prototype.getAll.bind(this),
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitElement;
  } else {
    app.CircuitElement = CircuitElement;
  }
})(this.app || (this.app = {}));
