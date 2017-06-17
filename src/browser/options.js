//'use strict'

// Look at options.html to see updated dependencies
// Requires (might be outdated because I forgot to update it)
// - Handlebars
// Options for show as list populates or show when all done (better performance)
(function () {
  // Selects all the children of #container skipping over #tab div, storing it as an array
  var _tabs = Array.prototype.slice.call(document.getElementById('tabs').children);
  var _contentAreas = Array.prototype.slice.call(document.querySelectorAll('#container > :not(#tabs)'));

  function tabNavMouseDown(e) {
    var i;
    for (i = 0; i < _tabs.length; ++i)
      _tabs[i].classList.remove('active');
    e.target.classList.add('active');

    for (var i = 0; i < _contentAreas.length; ++i)
      _contentAreas[i].style.display = 'none'; // Hide all the content areas
    document.getElementById(e.target.id + '-content').style.display = ''; // And restore defualt display for the clicked one
  }
  
  // Make the tab bar clickable
  document.getElementById('tabs').addEventListener('mousedown', tabNavMouseDown);
  document.addEventListener('DOMContentLoaded', function () { 
    // Both work
    //document.getElementById('tabs').children[0].dispatchEvent(
    //  new Event('mousedown', {bubbles: true, cancelable: false}));
    tabNavMouseDown({target: document.getElementById('tabs').children[0]});
  });
})();

(function (global) {
  function saveOptions() {
    browser.storage.local.set();
  }

  function getOptions() {
    browser.storage.local.get();
  }

  function checkChanges() {

  }
})(this);