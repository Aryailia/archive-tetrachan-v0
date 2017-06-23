//https://github.com/goldendict/goldendict

// Web Extensions
// https://developer.chrome.com/extensions/messaging#external
// https://stackoverflow.com/questions/42108782/firefox-webextensions-get-local-files-content-by-path
// https://stackoverflow.com/questions/13544179/jsdom-document-queryselector-enabled-but-is-missing-from-document
// https://github.com/tautologistics/node-htmlparser
// https://github.com/fb55/htmlparser2/issues/200
'use strict';

/**
 * @todo Rank readings for jisho?
 * @todo Add handle for no search results
 * @todo Exclusion regex (old for extension)
 * @todo polyfill for fetch (old for extension)
 */
// C++ analogy: Lexicon is like a header file and this is the implementation
var htmlparser = require('htmlparser2');
var selector = require('./selector.js');
var lexicon = require('./lexicon.js');
var $ = require('../../lib/Compose/compose.js');

/*$.flow = function () {
  var fn = arguments;
  return function (input) {
    Object.keys(fn).forEach(function (index) {
      input = fn[index](input);
    });
    return input;
  };
};*/

//htmlparser.

function _selectTag(property, tag, node) {
  return $.filter(function (child) {
    return child[property] === tag;
  }, node);
}
function _selectAttribs(property, tag, node) {
  return $.filter(function (child) {
    return child.hasOwnProperty('attribs') && child.attribs[property] === tag;
  }, node);
}

var output = {
  processJson: function (response) {
    return JSON.parse(response);
  },
  processError: function (error) {
    console.error(error);
  },
  onlineLookup: function searchOnline(dictionaryName, text, flags, fetcher) {
    if (output.web.hasOwnProperty(dictionaryName)) {
      return output.web[dictionaryName](lexicon.factory(), text, fetcher);
    } else {
      return Promise.reject('No dictionary named' + dictionaryName);
    }
  },
  offlineLookup: function (dictionaryName, text, flags, fetcher) {
    if (output.local.hasOwnProperty(dictionaryName)) {
      return output.local[dictionaryName](lexicon.factory(), text, fetcher);
    } else {
      return Promise.reject('No dictionary named' + dictionaryName);
    }
  },
  local: {},
  web: {},
};

var offline = output.local;
var online = output.web;


/**
 * @todo compare speed of multiline regex vs splitting across newlines/node\
 * native multiline processing
 * @todo will need unit test to make sure we aren't double counting any words
 * and that we aren't missing out last entry in a buffer chunk
 * @todo of course add file failure code
 */
offline.cedict = function (lexicon, text, loader) {
  var wb = '[ \\n\\[\\]\\/]';
  var query;
  switch ('') { // Simplified, traditional, pinyin, and english
    //case 's': query = new RegExp('^.*(' + text + ').*$','igm'); break;
    //case 't': query = new RegExp('^.*(' + text + ').*$','igm'); break;
    //case 'p': query = new RegExp('^.*(' + text + ').*$','igm'); break;
    //case 'e': query = new RegExp('^.*(' + text + ').*$','igm'); break;
    default: query = //new RegExp('^(.*' + text + wb +'.*)$', 'igm');
    new RegExp('((?:\n|\n.*' + wb + ')' + text + wb +'.*)$', 'igm');
    //console.log(query);
  }
  var process = /^\n?([^#]\S*) (\S+) \[(.+)\] \/(.+)\/$/;

  return loader(function (last, chunk) {
    var toProcess = '\n' + last.substr(last.lastIndexOf('\n') + 1) + chunk;
    var searchResult, decompose;
    while ((searchResult = query.exec(toProcess)) != null  && lexicon.list.length < 10) {
      if ((decompose = process.exec(searchResult[0])) != null) {
        lexicon.add({
          word: decompose[1],
          reading: decompose[3],
        }).classes.add({
        }).senses.add({
          meaning: decompose[4],
        });
        //console.log(Object.keys(searchResult), searchResult.length);
      }
    }
  }).then(function () {
    return lexicon;
  });
};

function _weblioSection(openTag, closeTag) {
  function _process(char) {
    return char === ' ' ? ' *' : '\\u' + char.charCodeAt(0).toString(16);
  }
  var start  = openTag.split('').map(_process).join('');
  var finish = closeTag.split('').map(_process).join('');
  return new RegExp('<!--' + start + '-->[\\S\\s]*?<!--' + finish +'-->');
}

var html = require('htmlparser-to-html');
var fs = require('fs');
var util = require('util');


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

function _processWeblio(data, dict) {
  var warehouse = lexicon.factory();
  var match = data.match(_weblioSection(' 開始 ' + dict + ' ', ' 終了 ' + dict + ' '));
  $(selector.stepQuery(['.kijiWrp', '.kiji', '.NetDicBody'], selector.parse(match[0] + '</div>')))
    .foreach(function (headword) {
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
    }).value();
  return warehouse;

  //fs.writeFile('./personal/test.html', html(data), {encoding: 'utf8'}, function(err) {
  //  console.log('The file was saved!');
  //});
}

online.weblio = function (list, text, fetcher) {
  text = 'きみ';
  var url = 'http://www.weblio.jp/content/';
  return fetcher(url + encodeURIComponent(text)).then(function (data) {
    //var hokkaido = selector.parse(text.match(_weblioSection('北海道方言辞書')));
    //var tsugaru =  selector.parse(text.match(_weblioSection('津軽語辞典')));
    return _processWeblio(data, '三省堂 大辞林');
  });
};

function _gooParseEntryPage(wordPage) {
  var html = selector.parse(wordPage.match(/<!-- Leaf -->[\S\s]+<!-- \/Leaf -->/));
  var entry = _selectTag('name', 'div', html)[0];
  var body = selector.stepQuery(['div', '.content-box visible'], html)[0].children;
  var explanation = _selectAttribs('class', 'explanation',
    _selectAttribs('class', 'kokugo', body)[0].children
  )[0].children;

  var title = $(_selectTag('name', 'h1', entry.children)[0].children)
    .filter(function (child) { return child.hasOwnProperty('data'); })
    .map(function (child) { return child.data; } )
    .value().join('');
  var definitions = _selectTag('name', 'ol', explanation).map(x => x.children);
  var synonyms = _selectTag('name', 'div', explanation)[0];
  var partOfSpeech =
    //_selectTag('name', 'a',
      //_selectTag('name', 'li',
        _selectAttribs('class', 'list-tag-b', body)[0].children
      //)[0].children
    //)[0]//.children[0].data;
    
  //domutils.getText(partOfSpeech).trim();  
  console.log('---');
  console.log('title', title);
  //console.log('body', definitions);
  //console.log('class', partOfSpeech);
  //console.log(domutils.find(function (a) {console.log(a);}, body));
}

online.goo = function (list, text, fetcher) {
  text = 'きみ';
  var url = 'https://dictionary.goo.ne.jp:443';
  //https://dictionary.goo.ne.jp/freewordsearcher.html?MT=君&mode=1&kind=jn
  //https://dictionary.goo.ne.jp/srch/jn/%E3%81%8D%E3%81%BF/m1u/
  //<li data-value="0">で始まる</li>
  //<li data-value="1" class="NR-now">で一致する</li>
  //<li data-value="2">で終わる</li>
  //<li data-value="3">を説明文に含む</li>
  //<li data-value="6">を見出しに含む</li>
  var test = url + '/srch/jn/' + encodeURIComponent(text) + '/m1u/';
  console.log(test);
  (fetcher(test)
  //(fetcher(url + '/srch/jn/' + text + '/m1u/')
    .then(function (search) {
      //var resultSection = search.match(/<ul class="list-search-a">[\S\s]*?<\/ul>/);
      //console.log(resultSection);
      var results = /<ul class="list-search-a">([\S\s]*?)<\/ul>/.exec(search);
      //var 
      console.log(search);
      if (results === null) {
        throw new Error('Error: goo - Regex could not parse output.');
      }
      return($(_parseHtml(results[1]))
        .filter(function (node) { return node.name === 'li'; })
        //.foreach(function (x) { console.log(x); }) // For testing
        .map(function (liNode) { return _selectTag('name', 'a', liNode.children)[0]; })
        .map(function (linkNode) { // Process links
          var entry = _selectTag('name', 'dl', linkNode.children)[0];
          return {
            link: linkNode.attribs.href,
            word: _selectTag('name', 'dt', entry.children)[0].children[0].name,
            preview:
              _selectAttribs('class', 'mean text-b', _selectTag('name', 'dd',
                entry.children))[0].children[0].raw,
          };
        }).map(function (parsedSearch) {
          var path = parsedSearch.link.replace(/[^/]*\/$/, '');
          return(fetcher(url + path)
            .then(_gooParseEntryPage)
            .catch(output.processError)
          );
        }).value()
      );
    }).then (function (results) {
      //results.forEach(x => console.log(x));
    }).catch(output.processError)
  );
  return Promise.resolve('50');
};

online['so-mdbg'] = function (lexicon, text, fetcher) {
  var url = 'https://www.mdbg.net/chinese/rsc/img/stroke_anim/';
  return fetcher(url + text.charCodeAt(0) + '.gif');
};

online.jisho = function (lexicon, text, fetcher) {
  var url = 'http://jisho.org:80/api/v1/search/words?keyword=';
  ////var benchmark1 = new Date().getTime();
  return(fetcher(url + encodeURIComponent(text))
    .then(output.processJson)
    .then(function (data) {
      if (data.meta.status === 200) {
        // Add reading
        
        ////var benchmark2 = new Date().getTime();
        ////console.log('Request took ' + (benchmark2 - benchmark1));
        data.data.forEach(function (entry) {
          var primaryReading = entry.japanese[0];
          var senseList = lexicon.add({
            word: primaryReading.word,
            reading: primaryReading.reading,
            allographes: entry.japanese
              .filter(function (entry, i) { return i > 0; })
              .map(function (entry) {
                return [entry.word, entry.reading];
              }),
            //ipa: '',
          }).classes;

          // Have to group part of speech together because Jisho leaves them
          // empy if future english_definitions share the same sense
          $(entry.senses)
            // Reverse so part of speech is at the end of the group
            .reverse()
            // Remove entries with no definition
            .filter(function (sense) {
              return sense.hasOwnProperty('english_definitions') &&
                sense.english_definitions !== '';
            // Turn part of speech into a string
            }).foreach(function (sense) {
              sense.parts_of_speech = sense.parts_of_speech.join('; ');
            
            // Group into shared part-of-speech (word class) chunks
            }).chunk(function (sense) { 
              return sense.parts_of_speech !== '';
            // Add part-of-speech group with the different associated
            // sense (definitions) into said group
            }).foreach(function (classChunk) {
              // Add and get back the part-of-speech (word class) group
              var group = senseList.add({
                category: classChunk[classChunk.length - 1].parts_of_speech
              }).senses;
              // And add all the definitions to that word class group
              classChunk.forEach(function (wordClass) {
                group.add({
                  meaning: wordClass.english_definitions.join('; '),
                  examples: [

                  ],
                });
              });
            }).value();
        
          ////var benchmark3 = new Date().getTime();
          ////console.log('Processing took ' + (benchmark3 - benchmark2));
          ////console.log('Total ' + (benchmark3 - benchmark1));
        });
        // Rank readings?

        return lexicon;
      } else {
        throw new Error('Jisho request fail: ' + data.meta);
      }
    }).catch(output.processError)
  );
};

//*/
module.exports = output;

// Old implementation
/*var TetraChanDictionaryInterface = Object.create(null);
(function (dictionary, utils) {
  function query(text, pusher, json) {
    //console.log(JSON.stringify(json, null, 2));
    var entries = json.data;
    var i, j, x, matches, japanese;

    for (i = 0; i < entries.length; ++i) {
      matches = false;
      japanese = entries[i].japanese;
      for (j = 0; !matches && (j < japanese.length); ++j) {
        x = japanese[j];
        matches = matches || (text === x.word) || (text === x.reading);
      }

      // If 
      if (matches) {
        pusher(entries[i]);
      }
    }
  }

  dictionary.onlineSearch = function(text, pusher, url) {
    var i;
    for (i = 1; i <= text.length; ++i) {
      //console.log(url + encodeURIComponent(quote));
      var quote = text.substr(0, i);
      var search = fetch(url + encodeURIComponent(text.substr(0, i)))
        .then(utils.responseJSON)
        //.then(query.bind(this, quote, pusher));//*/
      
//    }
//  };
//}(TetraChanDictionaryInterface, TetraChanUtils));