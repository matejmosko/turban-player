// Mixing jQuery and Node.js code in the same file? Yes please!

$(function() {
 const path = require('path');
 const url = require('url');
 const fs = require('fs');
 const markpress = require('markpress');
 const webview1 = document.querySelector('#nextImpress-1'),
  webview2 = document.querySelector('#nextImpress-2'),
  webview0 = document.querySelector('#impressCurrent');
 const {
  dialog
 } = require('electron').remote;
 const settings = require('electron').remote.require('electron-settings');
 var ipc = require('electron').ipcRenderer,
  slidesList = [],
  opts = {},
  running = false,
  exitDialog = document.querySelector("x-dialog");
 setupSettings();

 // Setup Settings Database
 function setupSettings() {
  if (!settings.has("name")) {
   ipc.send('saveDefaultSettings');
  }
  loadSettings(settings.getAll());
 }

 function loadSettings(p) {
  opts = p;
 }

 /* Logs */

 function saveLogs(text) {
  console.log(text);
  ipc.send('saveLogs', text);
 }

 function loadFile(loadedFile) { // load file
  file = fs.openSync(loadedFile[0], 'a');
  fs.readFile(loadedFile[0])
 }

 /* UI part - all buttons tabs, radios etc. */

 $("#currentSlideTab").click(function() { // Toggle between main view Tabs
  $('#currentSlideDiv').show();
  $('#allSlidesDiv').hide();
  $('#teamsTableDiv').hide();
  $('#optionsDiv').hide();
 });
 $("#allSlidesTab").click(function() {
  $('#currentSlideDiv').hide();
  $('#allSlidesDiv').show();
  $('#teamsTableDiv').hide();
  $('#optionsDiv').hide();
 });
 $("#teamsTableTab").click(function() {
  $('#currentSlideDiv').hide();
  $('#allSlidesDiv').hide();
  $('#teamsTableDiv').show();
  $('#optionsDiv').hide();
 });
 $("#optionsTab").click(function() {
  $('#currentSlideDiv').hide();
  $('#allSlidesDiv').hide();
  $('#teamsTableDiv').hide();
  $('#optionsDiv').show();
 });

 $("#fullscreenBtn").click(function() { // Toggle Projector Window fullscreen
  ipc.send('toggleFullscreen');
 });
 $("#rulesBtn").click(function() { // Toggle visibility of Rules div
  ipc.send('toggleRules');
 });

 $("#projectorBtn").click(function() { // Toggle visibility og Projector Window
  ipc.send('toggleProjector');
 });

 ipc.on('buttonSwitch', (event, btn, x) => { // Toggle "toggled" state of top buttons when non-click event change status
  if (x) {
   $(btn).prop("toggled", true)
  }
  else $(btn).prop("toggled", false);
 });

 ipc.on('quitModal', (event) => { // Show "Really Quit" dialog
  exitDialog.opened = true;
 });

 $("#reallyQuit").click(function() { // "Really Quit"  confirmed. We are leaving the ship.
  ipc.send('reallyQuit');
 });

 $("#doNotQuit").click(function() { // "Really Quit" refused. The show must go on...
  exitDialog.opened = false;
 });

 $("#openFile").click(function() {
  dialog.showOpenDialog((fileNames) => {
   if (fileNames === undefined) {
    console.log("No file selected");
    return;
   }
   parseProjection(fileNames[0]);
  });
 });

 /* Main Software Part */

 function parseProjection(file) {
  fs.readFile(file, 'utf-8', (err, data) => {
   if (err) {
    alert("An error ocurred reading the file :" + err.message);
    return;
   }

   if (path.extname(file) == ".md") {

    const options = { // Better API (Markpress) but not working right now
     layout: 'horizontal',
     theme: 'light',
     autoSplit: true,
     allowHtml: false,
     verbose: false,
     embed: false,
     title: 'Optional title for output HTML'
    };

    markpress(file, options).then(({
     html,
     md
    }) => {
     html = html.substr(15);
     var parser = new DOMParser()
     var el = parser.parseFromString(html, "text/html");
     var x = el.getElementsByTagName("script");
     for (var i = 0; i < x.length; i++) {
      x[i].innerHTML = "";
     }
     console.log(el);
     html = el.getElementsByTagName("html")[0].outerHTML;
     console.log(html);
     loadProjection(html);
    });
   }

   if (path.extname(file) == ".html" || path.extname(file) == ".htm") {
    var parser = new DOMParser()
    var el = parser.parseFromString(data, "text/html");
    data = el.getElementById('impress');

    loadProjection(data.outerHTML);

    //loadProjection(data);
   }
  });

 }

 function getFutureSlides(current, offset) {
  let i = slideList.indexOf(current);
  let n = slideList.length;
  if (n - i > 2) {
   return slideList[i + offset];
  }
  if (n - i == 2 && offset == 1) {
   return slideList[i + offset];
  }
  if (n - i == 2 && offset == 2) {
   return slideList[0];
  }
  if (n - i == 1 && offset == 1) {
   return slideList[0];
  }
  if (n - i == 1 && offset == 2) {
   return slideList[1];
  }
 }

 function renderNextSlide(current) {
  ipc.send('projectionGoToSlide', current);
  webview0.send('projectionGoToSlide', current);
  webview1.send('gotoSlide', getFutureSlides(current, 1));
  webview2.send('gotoSlide', getFutureSlides(current, 2));
 }

 function loadProjection(data) {
  if (!running) {
   ipc.send('loadProjection', data, 'projektor');
   webview0.send('loadProjection', data, 'current');
   webview1.send('loadProjection', data, 'next1');
   webview2.send('loadProjection', data, 'next2');
   running = true;
  }
 }

 webview0.addEventListener('ipc-message', (event) => {
  switch (event.channel) {
   case 'gotoSlide':
    renderNextSlide(event.args[0]);
    break;
   case 'slideList':
    slideList = event.args[0];
    renderNextSlide(event.args[1]);
    break;
   default:
    console.log("There is something new coming from impress.js.");
  }
 })

 $("#prevSlideBtn").click(function() {
  webview0.send('prevSlide');
 });
 $("#nextSlideBtn").click(function() {
  webview0.send('nextSlide');
 });
 ipc.on('gotoSlide', (event, next) => {

 });

 /* Uncomment for debugging */
 /*
 webview1.addEventListener('console-message', (e) => {
  console.log('Guest page logged a message:', e.message)
 })
*/
 webview0.openDevTools();

});
