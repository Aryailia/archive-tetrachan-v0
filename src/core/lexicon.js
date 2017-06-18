// Todo
// - Exclusion regex
// - polyfill for fetch
// - polyfill for 

var SUB_CATEGORY_1 = 'classes';
var SUB_CATEGORY_2 = 'definitions';

var _lexemes, _wordClasses;
// Outline is all the possible entries for options at that level
// Note: .addDefinition() accepts a string, not an object unlike the others
// 
// Indentation levels are for programmers who want to use the API
// Everything on the same indentation level is what you can expect to have
// access to at that level with the exception of mixins.
//
// Mixin add functionality to the outside. (Good explanation coming soon TM)
// 
// Eg. You get word, reading, ipa, alternate, and classes{}
//   Inside classes you have access to addCategory [and list]
// 
// Note: this only supports having outline, mixin, and the one subdivision,
//   so will have to redo _factory() if want to add more in future
var lexicon = {
  lexemes: { outline: {
    // The following are the accessible properties for lexemesList
    // And can be specified by options
    word: '',
    reading: '',
    ipa: '',
    alternate: [],}, // Last of options

    //list: [], // This gets added _factory()
    [SUB_CATEGORY_1]: { outline: {
      // The following are the accessible properties for word classes
      // And can be specified by options
      category: '',}, // Last of option
      
      //list: [], // This gets added _factory()
      [SUB_CATEGORY_2]: { outline:
        {}, // No properties for definitions, just the list

        //list: [], // This gets added by _factory()
      },

      mixin: { // For definitions
        addDefinition: function (definitions, meaning) {
          definitions.list.push(meaning);
        }
      },
    },
    mixin: { // For word classes
      addCategory: function (wordClassGroup, options) {
        var obj = settingsOver(_wordClasses.outline, options);
        obj[SUB_CATEGORY_2] = _factory(_wordClasses.mixin);
        wordClassGroup.list.push(obj);
        return obj;
      },
    },
  },

  mixin: { // For lexemes
    addLexeme: function (lexemesList, options) {
      var obj = settingsOver(_lexemes.outline, options);
      obj[SUB_CATEGORY_1] = _factory(_lexemes.mixin);
      lexemesList.list.push(obj);
      return obj;
    },
  },
};
function _lexiconFactory() {
  return _factory(lexicon.mixin);
}

_lexemes = lexicon.lexemes;
_wordClasses = lexicon.lexemes.classes;

var output = {
  factory: _lexiconFactory,
  lexiconMixin: lexicon.mixin,
  lexemeMixin: _lexemes.mixin,
  classMixin: _wordClasses.mixin,
};

// Helper functions
function settingsOver(possibilities, settings) {
  var obj = Object.create(null);
  Object.keys(possibilities).forEach(function (key) {
    var toAdd = settings.hasOwnProperty(key)
      ? settings[key]
      : possibilities[key];

    obj[key] = typeof toAdd === 'object'
      ? Object.assign(toAdd.constructor(), settings[key]) // One-level deep clone
      : toAdd; // Or just straight copy
    delete settings[key];
  });

  if (Object.keys(settings).length > 0) { // If any properties left over
    throw new Error('{settings} passed with invalid arguments' + settings);
  }
  return obj;
}

// Object composition
function _factory(mixin) {
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


module.exports = output;