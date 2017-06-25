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
var selector = require('./selector.js');
var lexicon = require('./lexicon.js');
var $ = require('../../lib/Compose/compose.js');

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

var web = output.web;
var local = output.local;

web.weblio = require('../dicts/weblio.js');

/**
 * @todo compare speed of multiline regex vs splitting across newlines/node\
 * native multiline processing
 * @todo will need unit test to make sure we aren't double counting any words
 * and that we aren't missing out last entry in a buffer chunk
 * @todo of course add file failure code
 */
local.cedict = function (lexicon, text, loader) {
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

  return loader('./lib/cedict_ts-2017-06-19.u8', function (last, chunk) {
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

web['so-mdbg'] = function (lexicon, text, fetcher) {
  var url = 'https://www.mdbg.net/chinese/rsc/img/stroke_anim/';
  return fetcher(url + text.charCodeAt(0) + '.gif');
};

web.jisho = function (lexicon, text, fetcher) {
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

web.goo = function (list, text, fetcher) {
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

//*/
module.exports = output;