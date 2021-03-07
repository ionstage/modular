if (typeof globalThis === 'undefined') {
  // define `globalThis` for IE
  self.globalThis = this;
}

self.importScripts('opal.min.js');

// disable network access
self.importScripts = null;
self.XMLHttpRequest = null;
self.fetch = null;
self.WebSocket = null;

self.addEventListener('message', (function() {
  var input = null;
  var output = '';
  var error = '';

  self.Opal.global.console.log = function(s) {
    output += s;
  };

  self.Opal.global.console.warn = function(s) {
    error += s;
  };

  self.Opal.STDIN.$read = function() {
    if (arguments.length !== 0) {
      throw 'read: not implemented';
    }
    return (input !== null ? input : self.Opal.nil);
  };

  return function(event) {
    var data = event.data;

    input = data.input;
    output = '';
    error = '';

    try {
      self.Opal.eval(data.code);
    } catch (e) {
      self.postMessage({
        output: null,
        error: null,
        exception: e.toString() || 'undefined exception',
      });
      return;
    }

    self.postMessage({
      output: output,
      error: error,
      exception: '',
    });
  };
})(), false);
