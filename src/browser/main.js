(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    // Dependancies
    var body = document.getElementById('test').contentWindow.document;
    var dictionary = TetraChanDictionaryInterface;
    var popup = TetraChanPopup(document.body, undefined, [document.body, body], {
      throttle: 500,
      onCaretChange: function (text) {
        popup.clear();
        if (text !== "") {
          //dictionary.onlineSearch(text, popup.push,
          //  'http://jisho.org/api/v1/search/words?keyword=');
        }
//        console.log(dictionary);
//        console.log(text);
      }
    });


    //console.log(JSONP);
    var test = encodeURIComponent('食');
    JSONP('http://jisho.org/api/v1/search/words?keyword=' + test, function (json) {
      console.log(json);
    });
    /*console.log(test, fetch('http://jisho.org/api/v1/search/words?keyword=' + test, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      cache: 'no-cache' }
    ));*/
  });
}());

/*var dcpopup = new Popup(document.body);
let extract = new TextInput();//function (text) {

extract.onCaretChange = function (text) {
  var dict = new Dictionaries(dcpopup);
  dict.onlineSearch(
    text.substr(0,6),
    'http://jisho.org/api/v1/search/words?keyword=');
  
  //console.log(text);
};
extract.hoverTimer = 200;

dcpopup.show();
//setTimeout(function () {dcpopup.hide();}, 800);
/*dcpopup.ready.then(function () {
  dcpopup.push({
    test: 'hello',
    japanese: {'0': {word: '食', reading: 'しょく'}},
    senses: [
      {
        english_definitions: {0: 'meal', 1: "one's diet"},
        parts_of_speech: ['noun', 'adv', 'adj']
      }, {
        english_definitions: {0: 'eclipse (solar, lunar, etc.)'},
        parts_of_speech: ['noun']
      }
    ]
  });
});*/