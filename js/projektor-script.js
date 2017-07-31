// Mixing jQuery and Node.js code in the same file? Yes please!

$(function() {
  var ipc = require('electron').ipcRenderer,
    params = {},
    current,
    timer,
    running = false;

  const path = require('path');
  const url = require('url');
  const settings = require('electron').remote.require('electron-settings');
  // renderer process

  ipc.on('loadProjection', (event, loadedFile) => {
    if (!running) { // TEMPORARY SOLUTION. Nefunguje dobre, keď už je raz inicializovaný impress.js. Treba zistiť, ako ho viem zabiť.
      $('#impress').html(loadedFile);
      impress().init();
      running = true;
    }
  });

  ipc.on('gotoSlide', (event, arg) => {
    impress().goto(arg);
  });

});
