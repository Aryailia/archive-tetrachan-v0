var util = require('util');
var lexicon = require('../src/core/lexicon.js');

var dict = lexicon.factory();
var lexeme = dict.addLexeme({
  word: 'tasdf',
  reading: 'asdf',
  ipa: 'asdf',
  alternate: ['asdfklja', 'asdfklajsdf'],
});
var category = lexeme.classes.addCategory({
  category: 'noun'
});
var definition = category.definitions.addDefinition(
  'the blue cat'
);

console.log(util.inspect(lexeme, { showHidden: false, depth: null }));
console.log(definiton);