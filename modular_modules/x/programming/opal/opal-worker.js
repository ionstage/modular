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

var Opal = self.Opal;

var input = null;
var output = '';
var error = '';

Opal.global.console.log = function(s) {
  output += s;
};

Opal.global.console.warn = function(s) {
  error += s;
};

Opal.STDIN.$read = function() {
  if (arguments.length !== 0) {
    throw 'read: not implemented';
  }
  return (input !== null ? input : Opal.nil);
};

self.addEventListener('message', function(event) {
  var data = event.data;

  input = data.input;
  output = '';
  error = '';

  try {
    Opal.eval(data.code);
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
}, false);
