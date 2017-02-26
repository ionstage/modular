(function(app) {
  'use strict';

  var Point = function(props) {
    this.x = props.x;
    this.y = props.y;
  };

  Point.prototype.equal = function(other) {
    return (this.x === other.x && this.y === other.y);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Point;
  } else {
    app.Point = Point;
  }
})(this.app || (this.app = {}));
