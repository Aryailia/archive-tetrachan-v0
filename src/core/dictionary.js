'use strict';

/*try {

} catch (e) {
}*/
const IS_DEVELOPMENT = process.argv[2].trim().toLowerCase() === 'development'; 

// Dyanmic Loads
// Have to delete cache entries for non-native imports, otherwise it messes up
// for when it is required several times, which 
if (IS_DEVELOPMENT) {
  delete require.cache[require.resolve('../compose/compose.js')];
}
var $ = require(require.resolve('../compose/compose.js'));

function settingsOver(possibilities, settings) {
  var obj = Object.create(null);
  Object.keys(possibilities).forEach(function (key) {
    var toAdd = settings.hasOwnProperty(key)
      ? settings[key]
      : possibilities[key];
    
    obj[key] = typeof toAdd === 'object'
      ? Object.assign(toAdd.constructor(), settings) // One-level deep clone
      : toAdd; // Or just straight copy
    delete settings[key];
  });

  if (Object.keys(settings).length > 0) { // If any properties left over
    throw new Error('{settings} passed with invalid arguments' + settings);
  }
  return obj;
}

// Object composition
function factory(mixin) {
  var obj = Object.create(null);
  obj.list = [];
  Object.keys(mixin).forEach(function (methodName) {
    obj[methodName] = function () {
      var args = [obj].concat(Array.prototype.slice.call(arguments));
      return mixin[methodName].apply(null, args);
    };
  });
  return obj;
}


// Todo
// - Exclusion regex
// - polyfill for fetch
// - polyfill for 

function readingsListFactory() {
  return factory(readingsListMixin);
}

var readingsOutline = {
  word: '',
  reading: '',
  ipa: '',
  alternate: [],
};

var readingsListMixin = {
  addReading: function (readings, options) {
    var obj = settingsOver(readingsOutline, options);
    //console.log(arguments);
    obj.wordClasses = factory(senseMixin);
    readings.list.push(obj);
    return obj;
  },

  searchOnline: function (list, dictionaryName, text, fetcher) {
    if (!dictionaries.hasOwnProperty(dictionaryName)) {
      return Promise.reject('No dictionary named' + dictionaryName);
    } else {
      return dictionaries[dictionaryName](list, text, fetcher);
    }
  },
};

var wordClassOutline = {
  category: '',
};

var senseMixin = {
  addPartOfSpeech: function (wordClassGroup, options) {
    var obj = settingsOver(wordClassOutline, options);
    obj.definitions = factory(definitionMixin);
    wordClassGroup.list.push(obj);
    return obj;
  },
};

//var definitionOutline = {};

var definitionMixin = {
  addDefinition: function (definitions, meaning) {
    definitions.list.push(meaning);
  }
};



var dictionaries = {
  jisho: function (list, text, fetcher) {
    var url = 'http://jisho.org/api/v1/search/words?keyword=';
    return fetcher(url + encodeURIComponent(text))
      .then(function (response) { return JSON.parse(response); })
      .then(function (data) {
        if (data.meta.status === 200) {
          // Add reading
          data.data.forEach(function (entry) {
            var primaryReading = entry.japanese[0];
            var senseList = list.addReading({
              word: primaryReading.word,
              reading: primaryReading.reading,
              alternate: entry.japanese
                .filter(function (entry, i) { return i > 0; })
                .map(function (entry) {
                  return [entry.word, entry.reading];
                }),
              //ipa: '',
            }).wordClasses;

            $(entry.senses)
              .reverse()
              .foreach(function (sense) {
                sense.parts_of_speech = sense.parts_of_speech.join('; ');
              }).chunk(function (wordClassGroup) {
                return wordClassGroup.parts_of_speech !== '';
              }).foreach(function (wordClassGroup) {
                var group = senseList.addPartOfSpeech({ category: wordClassGroup[
                  wordClassGroup.length - 1].parts_of_speech}).definitions;
                wordClassGroup.forEach(function (wordClass) {
                  group.addDefinition(wordClass.english_definitions.join('; '));
                });
              }).value();
          });
          // Rank readings?

          return list;
        } else {
          throw new Error('Jisho request fail: ' + data.meta);
        }
      }).catch(function (err) {
        console.error(err);
      });
  },
};

module.exports = readingsListFactory;

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