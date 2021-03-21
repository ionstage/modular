(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');

  var ToggleButton = jCore.Component.inherits(function() {
    this.types = ['collapse', 'expand'];
    this.currentIndex = this.prop(0);
    this.button = new Button(this.el);
  });

  ToggleButton.prototype.toggle = function() {
    this.currentIndex((this.currentIndex() + 1) % this.types.length);
  };

  ToggleButton.prototype.done = function() {
    this.toggle();
    this.button.disabled(false);
  };

  ToggleButton.prototype.oninit = function() {
    this.button.on('tap', this.ontap.bind(this));
  };

  ToggleButton.prototype.onredraw = function() {
    this.redrawBy('currentIndex', function(currentIndex) {
      dom.data(this.el, 'type', this.types[currentIndex]);
    });
  };

  ToggleButton.prototype.ontap = function() {
    this.button.disabled(true);
    this.emit('toggle', this.done.bind(this));
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToggleButton;
  } else {
    app.ToggleButton = ToggleButton;
  }
})(this.app || (this.app = {}));
