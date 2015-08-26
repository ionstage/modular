(function(app) {
  'use strict';

  var PathContainer = function(element) {
    this._element = element;
    this._dirtyIDs = [];
    this._positionMap = {};
    this._connections = [];
  };

  PathContainer.prototype.append = function(sourceID, targetID) {
    var path = getPath(this, sourceID, targetID);

    if (path)
      return;

    var pathElement = dom.el('<path>', 'http://www.w3.org/2000/svg');
    pathElement.setAttribute('data-source-id', sourceID);
    pathElement.setAttribute('data-target-id', targetID);

    this._element.appendChild(pathElement);

    this._connections.push({
      sourceID: sourceID,
      targetID: targetID,
      element: pathElement
    });
  };

  PathContainer.prototype.remove = function(sourceID, targetID) {
    var path = getPath(this, sourceID, targetID);

    if (!path)
      return;

    this._element.removeChild(path.element);

    var connections = this._connections;
    for (var i = connections.length - 1; i >= 0; i--) {
      var connection = connections[i];
      if (connection.sourceID === sourceID && connection.targetID === targetID)
        connections.splice(i, 1);
    }
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

    path.sourceID = newSourceID;
    path.targetID = newTargetID;

    var pathElement = path.element;
    pathElement.setAttribute('data-source-id', newSourceID);
    pathElement.setAttribute('data-target-id', newTargetID);
  };

  PathContainer.prototype.position = function(id, point) {
    this._dirtyIDs.push(id);
    this._positionMap[id] = point;
  };

  PathContainer.prototype.updatePosition = function() {
    var dirtyIDs = this._dirtyIDs;
    var positionMap = this._positionMap;

    dirtyIDs.forEach(function(id) {
      var paths = getAllPaths(this, id, id);
      paths.forEach(function(path) {
        var sourcePoint = positionMap[path.sourceID];
        var targetPoint = positionMap[path.targetID];
        path.element.setAttribute('d', 'M' + sourcePoint.x + ',' + sourcePoint.y +
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
      return path.sourceID;
    else
      return null;
  };

  PathContainer.prototype.getTargetIDs = function(sourceID) {
    var paths = getAllPaths(this, sourceID);

    return paths.map(function(path) {
      return path.targetID;
    });
  };

  PathContainer.prototype.setFlushPath = function(sourceID, targetID, flag) {
    var path = getPath(this, sourceID, targetID);

    if (!path)
      return;

    var pathElement = path.element;

    if (flag)
      pathElement.setAttribute('class', 'flush');
    else
      pathElement.removeAttribute('class');
  };

  PathContainer.prototype.getConnectionList = function() {
    return this._connections.map(function(path) {
      return {
        sourceID: path.sourceID,
        targetID: path.targetID
      };
    });
  };

  var getPath = function(self, sourceID, targetID) {
    var connections = self._connections;

    for (var i = connections.length - 1; i >= 0; i--) {
      var connection = connections[i];
      if ((!sourceID || connection.sourceID === sourceID) && connection.targetID === targetID)
        return connection;
    }

    return null;
  };

  var getAllPaths = function(self, sourceID, targetID) {
    return self._connections.filter(function(connection) {
      return connection.sourceID === sourceID || connection.targetID === targetID;
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = PathContainer;
  else
    app.PathContainer = PathContainer;
})(this.app || (this.app = {}));