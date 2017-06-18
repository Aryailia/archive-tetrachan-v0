var util = require('util');
var lexicon = require('./core/lexicon.js');

var dict = lexicon.factory();
var lexeme = dict.addLexeme({
  word: 'tasdf',
  reading: 'asdf',
  ipa: 'asdf',
  alternate: ['asdfklja', 'asdfklajsdf'],
});
/*var category = lexeme.classes.addCategory({
  category: 'noun'
});
var definition = category.definitions.addDefinition(
  'the blue cat'
);*/

console.log(util.inspect(lexeme, { showHidden: false, depth: null }));
console.log(dict);


/*
//var multilingual = require('./unicode.js');
//multilingual.convertHalfWidth('！ｇｏｈｅｒｅ');
const Http = require('http');

function makeRequest(path) {
  return new Promise(function (resolve, reject) {
    Http.request({
      host: '127.0.0.1', // proxy IP
      port: 8080,        // proxy port
      method: 'GET',
      path: encodeURI(path)
    }, function (response) {
      var str = '';
      response.on('data', function (chunk) { str += chunk; });
      response.on('end', function () { resolve(str); });
    }).end();
  });
}

utils.makeRequest('http://jisho.org/api/v1/search/words?keyword=食')
  .then(x => console.log(x));
//*/