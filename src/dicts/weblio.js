//var html = require('htmlparser-to-html');
//var fs = require('fs');
//var util = require('util');

var selector = require('../core/selector.js');
var lexicon = require('../core/lexicon.js');
var $ = require('../../lib/Compose/compose.js');

function _weblioSection(openTag, closeTag) {
  function _process(char) {
    return char === ' ' ? ' *' : '\\u' + char.charCodeAt(0).toString(16);
  }
  var start  = openTag.split('').map(_process).join('');
  var finish = closeTag.split('').map(_process).join('');
  return new RegExp('<!--' + start + '-->[\\S\\s]*?<!--' + finish +'-->');
}

function _getLastDivIndex(nodeList) {
  return Math.max.apply( // Max of an array input
    null, // {this} is unnecessary for Math.max
    $.map(function (x, index) { // Array of 0 or index of div
      return x.name === 'div' ? index : 0;
    }, nodeList)
  );
}

var weblioType = {
  // Use of parentNodeList is only for finding the part of speech
  singleSense: function (warehouse, headwordEntry, parentNodeList, nodeList) {
    //selector.print(['parent','next','prev'], parentNodeList);
    // Limit to div then the children of that
    var partOfSpeechNodeList = selector.stepQuery(['div', '*'], parentNodeList);
    var lastDivIndex = _getLastDivIndex(partOfSpeechNodeList);
    var partOfSpeech = selector.getText(partOfSpeechNodeList.slice(0, lastDivIndex));
    var entry = selector.getText(nodeList);

    var lexeme = warehouse.add(headwordEntry);
    var wordClass = lexeme.classes.add({ category: partOfSpeech });
    wordClass.senses.add({ meaning: entry });
  },

  // This is actually the same as the enumeratedCategories case
  // However this has one less level of nesting since there's only one part
  // of speech represented in this case
  // todo: add the ku bit
  multiSense: function (warehouse, headwordEntry, parentNodeList, nodeList) {
    //var body = selector.stepQuery(['*', 'div', 'div'], nodeList);
    /*var partOfSpeechNodeList = selector.stepQuery(['div', '*'], parentNodeList);
    var lastDivIndex = _getLastDivIndex(partOfSpeechNodeList);
    var partOfSpeech = selector.getText(partOfSpeechNodeList.slice(0, lastDivIndex));
    selector.print(['parent','next','prev'], partOfSpeechNodeList);*/
    
    var lexeme = warehouse.add(headwordEntry);
    var wordClass = lexeme.classes.add({ });
    nodeList.forEach(function (node) {
      var entry = selector.getText([node.children[_getLastDivIndex(node.children)]]);
      wordClass.senses.add({
        meaning: entry,
      });
    });
  },

  // it has finally broke me, going to just do pattern matching
  // instead of trying to piece through the html structure
  neoMultiSense: function (wordClass, nodeList) {
    //var senses = selector.stepQuery(['*', '*', '*', '*'], nodeList);
    //selector.print(['parent','next','prev'], senses);
    var text = selector.getText(nodeList);
    var circledNumbers  = /[\u2460-\u2473]([^\u2460-\u2473]+)/g;
    var circledKatakana = /[\u32d0-\u32fe]([^\u32d0-\u32fe]+)/g;
    
    var mainSense = text.replace(circledNumbers, '').trim();
    if (mainSense != '') {
      wordClass.senses.add({ meaning: mainSense });
    }
    
    var senseMatch, subsenseMatch, subsensePattern, sense;
    while ((senseMatch = circledNumbers.exec(text)) != null) {
      sense = wordClass.senses.add({
        meaning: senseMatch[1].replace(circledKatakana, '').trim(),
      });
      subsensePattern = new RegExp(circledKatakana); // Didn't actually test if this is necessary
      while ((subsenseMatch = subsensePattern.exec(senseMatch[1])) != null) {
        sense.subsenses.add({ submeaning: subsenseMatch[1].trim() });
      }
    }
  },

  //
  enumeratedCategories: function (warehouse, headwordEntry, parentNodeList, nodeList) {
    var entryList = selector.stepQuery(['div', 'div'], parentNodeList);
    //selector.print(['parent','next','prev'], classNodeList);
    var lexeme = warehouse.add(headwordEntry);
    entryList.forEach(function (classNode) {
      var wordClass, lastDiv;
      var hasClassTest = selector.stepQuery(['*','div'], classNode.children);
      var isKuTest = selector.stepQuery(['*','*', '*'], classNode.children);
      //consol

      //console.log('---');
      selector.print(['parent','next','prev'], isKuTest);
      //console.log()
      if (isKuTest[0].data === '［句］') {
        wordClass = lexeme.classes.add({ category: '句' });
        // Splice(1) skips the first as the rest will be examples
        // Then split across the separator and add each as their own example
        // Todo: change over to example and not meaning
        selector.getText(isKuTest.splice(1)).split('・').forEach(function (sample) {
          wordClass.senses.add({ meaning: sample });
        });
      } else {
        lastDiv = hasClassTest[hasClassTest.length - 1]; // {hasClassText} is only divs
        //selector.print(['parent','next','prev'], [lastDiv.children[0]]);
        
        if (lastDiv.children[0].hasOwnProperty('children')) { // Then it's already listing senses
          wordClass = lexeme.classes.add({});
          hasClassTest.forEach(function (node) {
            var entry = selector.getText([node.children[_getLastDivIndex(node.children)]]);
            wordClass.senses.add({
              meaning: entry,
            });
          });
        } else { // Then we have classes we can add
          //selector.print(['parent','next','prev'], hasClassTest);
          var partOfSpeechNodeList = selector.stepQuery(['div', '*'], hasClassTest);
          var lastDivIndex = _getLastDivIndex(partOfSpeechNodeList);
          var partOfSpeech = selector.getText(partOfSpeechNodeList.slice(0, lastDivIndex));
          var entry = partOfSpeechNodeList[lastDivIndex].children;

          wordClass = lexeme.classes.add({ category: partOfSpeech });
          // ughhhhhhhhhhhhhhhhhhhhhhhhh, still has multiple cases want to get into habit of self calling
          // きみ, みる are examples
          weblioType.neoMultiSense(wordClass, entry);
        }
      }
    });

    //nodeList
  },

  // Examples: くん
  enumeratedKanji: function (warehouse, headwordEntry, parentNodeList, nodeList) {
    var kanjiNodeList = selector.stepQuery(['div', 'div'], parentNodeList);
    kanjiNodeList.forEach(function (kanjiNode) {
      var lastDivIndex = _getLastDivIndex(kanjiNode.children);
      var header = selector.getText(kanjiNode.children.slice(0, lastDivIndex));
      var entry = kanjiNode.children[lastDivIndex].children;

      //console.log('---');
      //console.log(header);
      var lexeme = warehouse.add({
        word: header,
      });
      var wordClass = lexeme.classes.add({});
      weblioType.neoMultiSense(wordClass, entry);
      //selector.print(['parent','next','prev'], entry);
    
    });
    //var lexeme = warehouse.add({});
    //var wordClass = lexeme.classes.add({});
    
  },
};

function processDictionary(data, dict) {
  var warehouse = lexicon.factory();
  var match = data.match(_weblioSection(' 開始 ' + dict + ' ', ' 終了 ' + dict + ' '));
  selector.stepQuery(['.kijiWrp', '.kiji', '.NetDicBody'], selector.parse(match[0] + '</div>'))
    .forEach(function (headword) {
      // Attention: Because using map, {headword} is a scalar
      // but selector methods work on arrays
      var head = selector.getText(headword.prev.prev.children)
        // match(/(.*) ［(0)］ 【(.*)】/) is basic idea of this regex
        .match(/([^\n]*?)(?:\uff3b(\d)\uff3d)?\s*(?:\u3010([^\n]*)\u3011)/);
      var body = headword.children;

      var content = selector.stepQuery(['*', 'div', 'div', 'div'], body);
      var pitchAccent = head[2] == undefined ? '' : ' [' + head[2] + ']';
      var info = {
        word: head[3],
        reading: (head[1] === '' ? head[3] : head[1]) + pitchAccent,
      };

      console.log('===');
      console.log(head.input);
      if (head.input.indexOf('［漢字］') !== -1) {
        weblioType.enumeratedKanji(warehouse, info, body, content);
        console.log('kanji');
      } else if (content.some(selector.attrib('style', 'float:left;'))) {
        weblioType.enumeratedCategories(warehouse, info, body, content);
        console.log('content length', content.length);
        console.log('categories');
      } else if (content.length > 1) {
        // Because they're the same case (or so I believe), trying to use
        // enumerated instead. Mostly important for how algorithm crawls the site
        weblioType.enumeratedCategories(warehouse, info, body, content);
        //weblioType.multiSense(warehouse, info, body, content);
        console.log('content length', content.length);
        console.log('multi');
      } else {
        weblioType.singleSense(warehouse, info, body, content);
        console.log('single');
      }
    });
  return warehouse;

  //fs.writeFile('./personal/test.html', html(data), {encoding: 'utf8'}, function(err) {
  //  console.log('The file was saved!');
  //});
}

module.exports = function (list, text, fetcher) {
  text = 'きみ';
  var url = 'http://www.weblio.jp/content/';
  return fetcher(url + encodeURIComponent(text)).then(function (data) {
    //var hokkaido = selector.parse(text.match(_weblioSection('北海道方言辞書')));
    //var tsugaru =  selector.parse(text.match(_weblioSection('津軽語辞典')));
    return processDictionary(data, '三省堂 大辞林');
  });
};