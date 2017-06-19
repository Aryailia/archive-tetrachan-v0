'use strict';

/**
 * @todo Rank readings for jisho?
 * @todo Add handle for no search results
 * @todo Exclusion regex (old for extension)
 * @todo polyfill for fetch (old for extension)
 */
// C++ analogy: Lexicon is like a header file and this is the implementation
var lexicon = require('./lexicon.js');
var $ = require('../../lib/Compose/compose.js');

var output = {
  processJson: function (response) {
    return JSON.parse(response);
  },
  processError: function (error) {
    console.error(error);
  },
  onlineLookup: function searchOnline(dictionaryName, text, fetcher) {
    if (!output.web.hasOwnProperty(dictionaryName)) {
      return Promise.reject('No dictionary named' + dictionaryName);
    } else {
      return output.web[dictionaryName](lexicon.factory(), text, fetcher);
    }
  },
  local: {},
  web: {},
};

var offline = output.local;
var online = output.web;

online.jisho = function (list, text, fetcher) {
  var url = 'http://jisho.org/api/v1/search/words?keyword=';
  ////var benchmark1 = new Date().getTime();
  return fetcher(url + encodeURIComponent(text))
    .then(output.processJson)
    .then(function (data) {
      if (data.meta.status === 200) {
        // Add reading
        
        ////var benchmark2 = new Date().getTime();
        ////console.log('Request took ' + (benchmark2 - benchmark1));
        data.data.forEach(function (entry) {
          var primaryReading = entry.japanese[0];
          var senseList = list.addLexeme({
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
              var group = senseList.addClass({
                category: classChunk[classChunk.length - 1].parts_of_speech
              }).definitions;
              // And add all the definitions to that word class group
              classChunk.forEach(function (wordClass) {
                group.addDefinition({
                  sense: wordClass.english_definitions.join('; '),
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

        return list;
      } else {
        throw new Error('Jisho request fail: ' + data.meta);
      }
    }).catch(output.processError);
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