(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Button = app.Button || require('./button.js');
  var Component = app.Component || require('./component.js');
  var SidebarToggleButton = app.SidebarToggleButton || require('./sidebar-toggle-button.js');

  var LoadButton = helper.inherits(function(props) {
    LoadButton.super_.call(this, props);
    this.loader = props.loader;
  }, Button);

  LoadButton.prototype.inputElement = function() {
    return dom.child(this.element(), 0);
  };

  LoadButton.prototype.registerChangeListener = function() {
    dom.on(this.inputElement(), 'change', function(event) {
      this.loader(event.target.files[0]);

      // reset file input
      dom.value(this.inputElement(), '');
    }.bind(this));
  };

  LoadButton.prototype.registerListeners = function() {
    this.registerTapListener();
    this.registerChangeListener();
  };

  LoadButton.prototype.ontap = function() {
    if (dom.supportsTouch()) {
      this.inputElement().click();
    }
  };

  var SaveButton = helper.inherits(function(props) {
    SaveButton.super_.call(this, props);
    this.saver = props.saver;
  }, Button);

  SaveButton.prototype.ontap = function() {
    this.saver();
  };

  var ContentHeader = helper.inherits(function(props) {
    ContentHeader.super_.call(this, props);

    this.disabled = this.prop(false);

    this.sidebarToggleButton = this.prop(new SidebarToggleButton({
      element: this.sidebarToggleButtonElement(),
      collapser: props.sidebarCollapser,
      expander: props.sidebarExpander,
    }));

    this.loadButton = this.prop(new LoadButton({
      element: this.loadButtonElement(),
      loader: props.fileLoader,
    }));

    this.saveButton = this.prop(new SaveButton({
      element: this.saveButtonElement(),
      saver: props.fileSaver,
    }));

    this.sidebarToggleButton().registerTapListener();
    this.loadButton().registerListeners();
    this.saveButton().registerTapListener();
  }, Component);

  ContentHeader.prototype.sidebarToggleButtonElement = function() {
    return dom.child(this.element(), 0);
  };

  ContentHeader.prototype.loadButtonElement = function() {
    return dom.child(this.element(), 1);
  };

  ContentHeader.prototype.saveButtonElement = function() {
    return dom.child(this.element(), 2);
  };

  ContentHeader.prototype.redraw = function() {
    this.sidebarToggleButton().redraw();
    this.redrawToggleClass('disabled', 'disabled');
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentHeader;
  } else {
    app.ContentHeader = ContentHeader;
  }
})(this.app || (this.app = {}));
