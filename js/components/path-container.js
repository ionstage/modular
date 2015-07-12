var pathContainer = (function() {
  var _element = null;
  var dirtyIDs = [];
  var positionMap = {};
  function createPathElement() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'path');
  }
  function element(value) {
    _element = value;
  }
  function append(sourceID, targetID) {
    var path = _element.querySelector('[data-source-id="' + sourceID + '"]' +
                                      '[data-target-id="' + targetID + '"]');
    if (!path) {
      path = createPathElement();
      path.setAttribute('data-source-id', sourceID);
      path.setAttribute('data-target-id', targetID);
      _element.appendChild(path);
    }
  }
  function remove(sourceID, targetID) {
    var path = _element.querySelector('[data-source-id="' + sourceID + '"]' +
                                      '[data-target-id="' + targetID + '"]');
    if (path)
      _element.removeChild(path);
  }
  function change(oldIDSet, newIDSet) {
    if (oldIDSet[0] === newIDSet[0] && oldIDSet[1] === newIDSet[1])
      return;
    var path = _element.querySelector('[data-source-id="' + oldIDSet[0] + '"]' +
                                      '[data-target-id="' + oldIDSet[1] + '"]');
    if (path) {
      var newPath = _element.querySelector('[data-source-id="' + newIDSet[0] + '"]' +
                                           '[data-target-id="' + newIDSet[1] + '"]');
      if (newPath)
        this.remove(newIDSet[0], newIDSet[1]);
      path.setAttribute('data-source-id', newIDSet[0]);
      path.setAttribute('data-target-id', newIDSet[1]);

    }
  }
  function position(id, point) {
    dirtyIDs.push(id);
    positionMap[id] = point;
  }
  function updatePosition() {
    for (var i = 0, i_len = dirtyIDs.length; i < i_len; i += 1) {
      var id = dirtyIDs[i];
      var paths = _element.querySelectorAll('[data-source-id="' + id + '"],' +
                                            '[data-target-id="' + id + '"]');
      for (var j = 0, j_len = paths.length; j < j_len; j += 1) {
        var path = paths[j];
        var sourceID = path.getAttribute('data-source-id');
        var targetID = path.getAttribute('data-target-id');
        var sourcePoint = positionMap[sourceID];
        var targetPoint = positionMap[targetID];
        path.setAttribute('d', 'M' + sourcePoint.x + ',' + sourcePoint.y +
                               'L' + targetPoint.x + ',' + targetPoint.y + 'Z');
      }
    }
    dirtyIDs = [];
  }
  function refreshPosition() {
    for (var id in positionMap) {
      var paths = _element.querySelectorAll('[data-source-id="' + id + '"],' +
                                            '[data-target-id="' + id + '"]');
      if (paths.length === 0)
        delete positionMap[id];
    }
  }
  function size(rect) {
    if ('width' in rect)
      _element.style.width = rect.width + 'px';
    if ('height' in rect)
      _element.style.height = rect.height + 'px';
  }
  function getSourceID(targetID) {
    var path = _element.querySelector('[data-target-id="' + targetID + '"]');
    if (path)
      return path.getAttribute('data-source-id');
    else
      return null;
  }
  function getTargetIDs(sourceID) {
    var targetIDs = [];
    var paths = _element.querySelectorAll('[data-source-id="' + sourceID + '"]');
    for (var i = 0, len = paths.length; i < len; i += 1) {
      targetIDs.push(paths[i].getAttribute('data-target-id'));
    }
    return targetIDs;
  }
  function setFlushPath(sourceID, targetID, flag) {
    var path = _element.querySelector('[data-source-id="' + sourceID + '"]' +
                                      '[data-target-id="' + targetID + '"]');
    if (path) {
      if (flag)
        path.setAttribute('class', 'flush');
      else
        path.removeAttribute('class');
    }
  }
  function getConnectionList() {
    var list = [];
    var paths = _element.childNodes;
    for (var i = 0, len = paths.length; i < len; i += 1) {
      var path = paths[i];
      list.push({
        sourceID: path.getAttribute('data-source-id'),
        targetID: path.getAttribute('data-target-id')
      });
    }
    return list;
  }
  return {
    element: element,
    append: append,
    remove: remove,
    change: change,
    position: position,
    updatePosition: updatePosition,
    refreshPosition: refreshPosition,
    size: size,
    getSourceID: getSourceID,
    getTargetIDs: getTargetIDs,
    setFlushPath: setFlushPath,
    getConnectionList: getConnectionList
  };
}());