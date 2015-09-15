(function(app) {
  'use strict';
  var m = require('mithril');

  var sidePanelView = function(ctrl) {
    var state = ctrl.state();
    var searchKeyword = ctrl.searchKeyword();
    var pieceList = ctrl.searchPieceList(searchKeyword);

    return m('#side_panel', {
      className: state
    }, [
      m('input#search_input', {
        type: 'search',
        autocapitalize: 'off',
        autocorrect: 'off',
        value: searchKeyword,
        config: searchInputConfig.bind(ctrl)
      }),
      m('#piece_list', {
        config: pieceListConfig.bind(ctrl)
      }, [
        m('#piece_list_content', pieceList.map(function(item) {
          return m('.piece-list-item', [
            m('.piece-list-item-container', {
              className: dom.supportsTouch() ? '' : 'hoverable',
              'data-piece-src': item.src
            }, [
              m('.piece-list-item-header', item.label),
              m('.piece-list-item-content', item.description)
            ])
          ]);
        }))
      ]),
      m('#divider', [
        m('#divider_icon', {
          config: dividerIconConfig.bind(ctrl)
        })
      ])
    ]);
  };

  var searchInputConfig = function(element, isInitialized) {
    if (isInitialized)
      return;

    var ctrl = this;

    var isFocus = false;
    if (dom.supportsTouch()) {
      document.addEventListener('touchstart', function(event) {
        if (event.target !== element)
          element.blur();
      });
    } else {
      element.addEventListener('blur', function() {
        isFocus = false;
      });
      element.addEventListener('click', function() {
        if (isFocus)
          return;
        isFocus = true;
        if (element.selectionStart === element.selectionEnd)
          element.select();
      });
    }

    var changeListener = function(event) {
      var cache = ctrl.searchKeyword();
      var value = event.target.value;

      if (value === cache)
        return;

      ctrl.dispatchEvent({
        type: 'searchkeywordchange',
        value: value
      });
    };
    element.addEventListener('change', changeListener);
    element.addEventListener('input', changeListener);
  };

  var pieceListConfig = function(element, isInitialized) {
    if (isInitialized)
      return;

    var ctrl = this;

    var isHeld;
    var draggingNode;
    var cloneOffset;
    var isFirstDrag;
    var isAutoClose;
    var cloneNode;

    var start = function() {
      var pieceListContent = element.children[0];

      cloneOffset = {
        left: draggingNode.offsetLeft - pieceListContent.scrollLeft,
        top: draggingNode.offsetTop - pieceListContent.scrollTop
      };

      isFirstDrag = true;
      isAutoClose = false;

      draggingNode.style.opacity = 0.6;

      dom.removeKeyboardFocus();

      cloneNode = draggingNode.cloneNode(true);
      dom.addClass(cloneNode, 'drag');
      document.body.appendChild(cloneNode);
    };

    dom.pointerEvent('.piece-list-item-container', {
      onstart: function(event) {
        isHeld = !dom.supportsTouch();
        draggingNode = event.target;
        if (!dom.supportsTouch())
          start();
      },
      onhold: function() {
        isHeld = true;
        if (dom.supportsTouch())
          start();
      },
      ondrag: function(event, dx, dy) {
        if (!isHeld)
          return;

        event.preventDefault();
        event.stopPropagation();

        if (isFirstDrag) {
          isFirstDrag = false;

          if (window.innerWidth < 358) {
            isAutoClose = true;
            ctrl.dispatchEvent({type: 'close'});
          }

          cloneNode.style.left = cloneOffset.left + 'px';
          cloneNode.style.top = cloneOffset.top + 'px';
        }

        dom.translate(cloneNode, dx, dy);
      },
      ondragend: function(event, dx, dy) {
        if (!isHeld)
          return;

        var pageX = cloneOffset.left + dx;
        var pageY = cloneOffset.top + dy;
        var dragEndEvent = {
          type: 'dragend',
          pageX: pageX,
          pageY: pageY,
          pieceSrc: cloneNode.getAttribute('data-piece-src'),
          pieceLabel: cloneNode.children[0].textContent
        };
        ctrl.dispatchEvent(dragEndEvent);
      },
      onend: function() {
        if (!isHeld)
          return;

        draggingNode.style.cssText = '';
        document.body.removeChild(cloneNode);

        if (isAutoClose)
          ctrl.dispatchEvent({type: 'open'});
      }
    });
  };

  var dividerIconConfig = function(element, isInitialized) {
    if (isInitialized)
      return;

    var ctrl = this;

    dom.pointerEvent('#divider_icon', {
      ontap: function() {
        ctrl.dispatchEvent({type: 'toggle'});
        dom.setCursor('default');
        dom.removeClass(element, 'tap');
      },
      onstart: function(event) {
        event.preventDefault();
        dom.addClass(element, 'tap');
        dom.removeKeyboardFocus();
        dom.setCursor('pointer');
      },
      onout: function() {
        dom.removeClass(element, 'tap');
        dom.setCursor('default');
      },
      onover: function() {
        dom.addClass(element, 'tap');
        dom.setCursor('pointer');
      }
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = sidePanelView;
  else
    app.sidePanelView = sidePanelView;
})(this.app || (this.app = {}));