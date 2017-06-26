(function(app) {
  'use strict';

  var circuit = require('circuit');
  var helper = app.helper || require('../helper.js');
  var Wrapper = helper.wrapper();

  var CircuitElement = function(members) {
    this.memberCollection = new CircuitElement.MemberCollection(members);
    return this.wrapper();
  };

  CircuitElement.prototype.get = function(memberName) {
    return this.memberCollection.get(memberName);
  };

  CircuitElement.prototype.getAll = function() {
    return this.memberCollection.getAll();
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

  CircuitElement.MemberCollection = (function() {
    var MemberCollection = function(members) {
      var table = {};
      var names = [];

      members.slice().reverse().forEach(function(props) {
        var name = props.name;
        if (!(name in table)) {
          table[name] = new CircuitElement.Member(props);
          names.unshift(name);
        }
      });

      this.table = table;
      this.names = names;
    };

    MemberCollection.prototype.get = function(name) {
      return this.table[name];
    };

    MemberCollection.prototype.getAll = function() {
      return this.names.map(function(name) {
        return this.get(name);
      }.bind(this));
    };

    return MemberCollection;
  })();

  CircuitElement.Member = (function() {
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
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitElement;
  } else {
    app.CircuitElement = CircuitElement;
  }
})(this.app || (this.app = {}));
