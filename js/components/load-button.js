(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');

  var LoadButton = jCore.Component.inherits(function() {
    this.button = new Button(this.el);
    this.input = new LoadButton.Input(dom.find(this.el, '.button-input'));
  });

  LoadButton.prototype.oninit = function() {
    this.button.on('tap', this.ontap.bind(this));
    this.input.on('load', this.emit.bind(this, 'load'));
  };

  LoadButton.prototype.ontap = function() {
    this.input.click();
  };

  LoadButton.Input = (function() {
    var Input = jCore.Component.inherits();

    Input.prototype.click = function() {
      dom.click(this.el);
    };

    Input.prototype.reset = function() {
      dom.value(this.el, '');
    };

    Input.prototype.oninit = function() {
      dom.on(this.el, 'change', this.onchange.bind(this));
    };

    Input.prototype.onchange = function(event) {
      var file = dom.file(dom.target(event));
      if (file) {
        this.emit('load', file);
        this.reset();
      }
    };

    return Input;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadButton;
  } else {
    app.LoadButton = LoadButton;
  }
})(this.app || (this.app = {}));
