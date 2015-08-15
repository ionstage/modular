(function(app) {
  'use strict';
  var m = require('mithril');
  var SidePanelController = app.SidePanelController || require('../controllers/side-panel-controller.js');

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
        config: function(element, isInitialized) {
          if (isInitialized)
            return;

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
        }
      }),
      m('#piece_list', {
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          setListItemDragEvent(element, function(event) {
            ctrl.dispatchEvent(event);
          });
        }
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
      m('#divider', {
        config: function(element, isInitialized) {
          if (isInitialized)
            return;
          dom.setMouseHoverEffect(element);
        }
      }, [
        m('#divider_icon', {
          config: function(element, isInitialized) {
            if (isInitialized)
              return;

            dom.tappable({
              element: element,
              ontap: function() {
                ctrl.dispatchEvent({type: 'toggle'});
                dom.setCursor('default');
                dom.removeClass(element, 'tap');
              },
              onstart: function() {
                dom.addClass(element, 'tap');
              },
              onout: function() {
                dom.removeClass(element, 'tap');
              },
              onover: function() {
                dom.addClass(element, 'tap');
              }
            });
          }
        })
      ])
    ]);
  };

  var setListItemDragEvent = (function() {
    var isTouchEnabled = dom.supportsTouch();
    var START = isTouchEnabled ? 'touchstart' : 'mousedown';
    var MOVE = isTouchEnabled ? 'touchmove' : 'mousemove';
    var END = isTouchEnabled ? 'touchend' : 'mouseup';

    return function(element, ondragend) {
      var cloneNode;
      var cloneOffset;
      var draggingNode;
      var isFirstDrag;
      var isAutoClose;

      function startListener(event) {
        var node = event.target.parentNode;

        if (!dom.hasClass(node, 'piece-list-item-container'))
          return;

        var pieceListContent = element.children[0];

        cloneOffset = {
          left: node.offsetLeft - pieceListContent.scrollLeft,
          top: node.offsetTop - pieceListContent.scrollTop
        };
        draggingNode = node;
        isFirstDrag = true;
        isAutoClose = false;

        node.style.cssText = dom.makeCSSText({opacity: 0.6});

        var activeElement = document.activeElement;
        if (activeElement && activeElement.blur)
          activeElement.blur();

        cloneNode = node.cloneNode(true);
        dom.addClass(cloneNode, 'drag');
        document.body.appendChild(cloneNode);

        dom.startDragEvent(event, {
          drag: dragListener,
          end: endListener
        });
      }

      function dragListener(dx, dy) {
        if (isFirstDrag) {
          isFirstDrag = false;

          if (board.clientWidth() < 46) {
            isAutoClose = true;
            sideView.close();
          }

          var cssText = dom.makeCSSText({
            left: cloneOffset.left + 'px',
            top: cloneOffset.top + 'px'
          });
          cloneNode.style.cssText = cssText;
        }

        dom.translate(cloneNode, dx, dy);
      }

      function endListener(dx, dy) {
        draggingNode.style.cssText = '';
        document.body.removeChild(cloneNode);

        if (dx !== 0 || dy !== 0) {
          var pageX = cloneOffset.left + dx;
          var pageY = cloneOffset.top + dy;
          var dragEndEvent = {
            type:'dragend',
            pageX: pageX,
            pageY: pageY,
            pieceSrc: cloneNode.getAttribute('data-piece-src'),
            pieceLabel: cloneNode.children[0].textContent
          };
          ondragend(dragEndEvent);
        }

        if (isAutoClose)
          sideView.open();
      }

      function clearTouchEvent(target) {
        isHold = false;
        if (tapHoldTimer !== null)
          clearTimeout(tapHoldTimer);
        document.removeEventListener(MOVE, touchMoveListener);
        document.removeEventListener(END, touchEndListener);
      }

      function touchMoveListener(event) {
        event = isTouchEnabled ? event.touches[0] : event;
        var dx = Math.abs(event.pageX - startOffset.left);
        var dy = Math.abs(event.pageY - startOffset.top);
        if (dx > 5 || dy > 5)
          clearTouchEvent();
      }

      function touchEndListener(event) {
        clearTouchEvent();
      }

      if (isTouchEnabled) {
        var isHold = true;
        var tapHoldTimer = null;
        var startOffset;

        element.addEventListener(START, function(event) {
          isHold = true;

          var touch = event.touches[0];
          startOffset = {
            left: touch.pageX,
            top: touch.pageY
          };

          if (tapHoldTimer !== null)
            clearTimeout(tapHoldTimer);
          tapHoldTimer = setTimeout(function() {
            tapHoldTimer = null;
            if (isHold) {
              document.removeEventListener(MOVE, touchMoveListener);
              document.removeEventListener(END, touchEndListener);
              startListener(event);
            }
          }, 300);

          document.addEventListener(MOVE, touchMoveListener);
          document.addEventListener(END, touchEndListener);
        }, false);
      } else {
        element.addEventListener(START, startListener);
      }
    };
  })();

  if (typeof module !== 'undefined' && module.exports)
    module.exports = sidePanelView;
  else
    app.sidePanelView = sidePanelView;
})(this.app || (this.app = {}));