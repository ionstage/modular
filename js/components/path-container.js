(function(app) {
  'use strict';

  var PathContainer = function(element) {
    this._element = element;
    this._dirtyIDs = [];
    this._positionMap = {};
  };

  PathContainer.prototype.append = function(sourceID, targetID) {
    var path = getPath(this, sourceID, targetID);

    if (path)
      return;

    path = dom.el('<path>', 'http://www.w3.org/2000/svg');
    path.setAttribute('data-source-id', sourceID);
    path.setAttribute('data-target-id', targetID);

    this._element.appendChild(path);
  };

  PathContainer.prototype.remove = function(sourceID, targetID) {
    var path = getPath(this, sourceID, targetID);

    if (path)
      this._element.removeChild(path);
  };

  PathContainer.prototype.change = function(oldIDSet, newIDSet) {
    var oldSourceID = oldIDSet[0];
    var oldTargetID = oldIDSet[1];
    var newSourceID = newIDSet[0];
    var newTargetID = newIDSet[1];

    if (oldSourceID === newSourceID && oldTargetID === newTargetID)
      return;

    var path = getPath(this, oldSourceID, oldTargetID);

    if (!path)
      return;

    var newPath = getPath(this, newSourceID, newTargetID);

    if (newPath)
      this.remove(newSourceID, newTargetID);

    path.setAttribute('data-source-id', newSourceID);
    path.setAttribute('data-target-id', newTargetID);
  };

  PathContainer.prototype.position = function(id, point) {
    this._dirtyIDs.push(id);
    this._positionMap[id] = point;
  };

  PathContainer.prototype.updatePosition = function() {
    var dirtyIDs = this._dirtyIDs;
    var positionMap = this._positionMap;

    dirtyIDs.forEach(function(id) {
      var paths = Array.prototype.slice.call(getAllPaths(this, id, id));
      paths.forEach(function(path) {
        var sourceID = path.getAttribute('data-source-id');
        var targetID = path.getAttribute('data-target-id');
        var sourcePoint = positionMap[sourceID];
        var targetPoint = positionMap[targetID];
        path.setAttribute('d', 'M' + sourcePoint.x + ',' + sourcePoint.y +
                               'L' + targetPoint.x + ',' + targetPoint.y + 'Z');
      });
    }.bind(this));

    this._dirtyIDs = [];
  };

  PathContainer.prototype.refreshPosition = function() {
    var positionMap = this._positionMap;

    for (var id in positionMap) {
      var paths = getAllPaths(this, id, id);
      if (paths.length === 0)
        delete positionMap[id];
    }
  };

  PathContainer.prototype.getSourceID = function(targetID) {
    var path = getPath(this, null, targetID);

    if (path)
      return path.getAttribute('data-source-id');
    else
      return null;
  };

  PathContainer.prototype.getTargetIDs = function(sourceID) {
    var paths = Array.prototype.slice.call(getAllPaths(this, sourceID));

    return paths.map(function(path) {
      return path.getAttribute('data-target-id');
    });
  };

  PathContainer.prototype.setFlushPath = function(sourceID, targetID, flag) {
    var path = getPath(this, sourceID, targetID);

    if (!path)
      return;

    if (flag)
      path.setAttribute('class', 'flush');
    else
      path.removeAttribute('class');
  };

  PathContainer.prototype.getConnectionList = function() {
    var element = this._element;
    var paths = Array.prototype.slice.call(element.childNodes);

    return paths.map(function(path) {
      return {
        sourceID: path.getAttribute('data-source-id'),
        targetID: path.getAttribute('data-target-id')
      };
    });
  };

  var getPath = function(self, sourceID, targetID) {
    var element = self._element;

    if (!sourceID)
      return element.querySelector('[data-target-id="' + targetID + '"]');

    return element.querySelector('[data-source-id="' + sourceID + '"]' +
                                 '[data-target-id="' + targetID + '"]');
  };

  var getAllPaths = function(self, sourceID, targetID) {
    var element = self._element;

    if (!targetID)
      return element.querySelectorAll('[data-source-id="' + sourceID + '"]');

    return element.querySelectorAll('[data-source-id="' + sourceID + '"],' +
                                    '[data-target-id="' + targetID + '"]');
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = PathContainer;
  else
    app.PathContainer = PathContainer;
})(this.app || (this.app = {}));