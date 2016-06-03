(function(app) {
  'use strict';

  var circuit = require('circuit');

  var Wrapper = function(self) {
    this.unwrap = Wrapper.unwrap.bind(self);
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
    this.sources = [];
    this.targets = [];
    this.wrapper = new Wrapper(this);
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
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CircuitElement;
  else
    app.CircuitElement = CircuitElement;
})(this.app || (this.app = {}));
