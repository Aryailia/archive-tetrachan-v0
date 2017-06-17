'use strict';

var TetraPopup = require('./popup.js');
var Utils = require('../browser/utils.js');

document.addEventListener('DOMContentLoaded', function () {
  // Dependancies
  var body = document.getElementById('test').contentWindow.document;
  var locationBar = document.getElementById('location');
  function nav(e) {
    window.fetch('http://127.0.0.1:8080/' + encodeURI(locationBar.value))
      .then(Utils.responseText)
      .then(x => body.write(x));
    //document.getElementById('test').src = locationBar.value;
  }
  locationBar.addEventListener('keydown',function (e) {
    if (e.keyCode == 13) {
      nav(e);
    }
  });
  document.getElementById('navigate').addEventListener('click', nav);
  //var dictionary = TetraChanDictionaryInterface;
  /*window.fetch('http://127.0.0.1:8080/' + encodeURI('http://jisho.org/api/v1/search/words?keyword=食'))
    .then(Utils.responseJSON)
    .then(x => console.log(x));*/

  var popup = TetraPopup(document.body, undefined, [document.body, body], {
    throttle: 500,
    onCaretChange: function (text) {
      console.log(text);
      /*popup.clear();
      if (text !== "") {
        //dictionary.onlineSearch(text, popup.push,
        //  'http://jisho.org/api/v1/search/words?keyword=');
      }
  //        console.log(dictionary);
  //        console.log(text);*/
    }
  });
  //popup.show();
  //console.log('yo');
});

//module.export = TetraPopup;
