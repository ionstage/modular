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
    var name = props.name;
    var arg = props.arg;
    var type = props.type;

    if (typeof type === 'undefined' || (type !== 'prop' && type !== 'event'))
      type = (name.indexOf('on') === 0) ? 'event' : 'prop';

    this.name = name;
    this.type = type;
    this.callee = circuit[type](arg);
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
