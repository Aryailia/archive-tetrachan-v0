// Todo
// - Exclusion regex
// - polyfill for fetch
// - polyfill for 

var settingsOver = require('./utils.js').settingsOver;
var SUB_CATEGORY_1 = 'lexeme';
var SUB_CATEGORY_2 = 'classes';
var SUB_CATEGORY_3 = 'senses';
var SUB_CATEGORY_4 = 'subsenses';

var _lexeme, _classes, _senses, _subsenses;
// Outline is all the possible entries for options at that level
// Note: .add() accepts a string, not an object unlike the others
// 
// Indentation levels are for programmers who want to use the API
// Everything on the same indentation level is what you can expect to have
// access to at that level with the exception of mixins.
//
// Mixin add functionality to the outside. (Good explanation coming soon TM)
// 
// Eg. You get word, reading, ipa, allographes, and classes{}
//   Inside classes you have access to addCategory [and list]
// 
// Note: this only supports having outline, mixin, and the one subdivision,
//   so will have to redo _factory() if want to add more in future
var lexicon = {
  [SUB_CATEGORY_1]: { outline: {
    // The following are the accessible properties for lexemesList
    // And can be specified by options
    word: '',
    reading: '',
    ipa: '',
    allographes: [], }, // Last of options

    //list: [], // This gets added _factory()
    [SUB_CATEGORY_2]: { outline: {
      // The following are the accessible properties for word classes
      // And can be specified by options
      category: '', }, // Last of option
      
      //list: [], // This gets added _factory()
      [SUB_CATEGORY_3]: { outline: {
        // The following are the accessible properties for word classes
        // And can be specified by options
        sense: '',
        examples: [], }, // Last of options

        //list: [], // This gets added _factory()
        [SUB_CATEGORY_4]: { outline: {
          // The following are the accessible properties for word classes
          // And can be specified by options
          subsense: '', }, // Last of option
        },

        mixin: { // For definitions
          add: function (mainSenses, options) {
            var obj = settingsOver(_subsenses.outline, options);
            mainSenses.list.push(obj);
          }
        },
      },
      mixin: { // For definitions
        add: function (definitions, options) {
          var obj = settingsOver(_senses.outline, options);
          obj[SUB_CATEGORY_4] = _factory(_senses.mixin);
          definitions.list.push(obj);
          return obj;
        }
      },
    },
    mixin: { // For word classes
      add: function (wordClassGroup, options) {
        var obj = settingsOver(_classes.outline, options);
        obj[SUB_CATEGORY_3] = _factory(_classes.mixin);
        wordClassGroup.list.push(obj);
        return obj;
      },
    },
  },

  mixin: { // For lexemes
    add: function (lexemesList, options) {
      var obj = settingsOver(_lexeme.outline, options);
      obj[SUB_CATEGORY_2] = _factory(_lexeme.mixin);
      lexemesList.list.push(obj);
      return obj;
    },
  },
};
function _lexiconFactory() {
  return _factory(lexicon.mixin);
}

_lexeme = lexicon[SUB_CATEGORY_1];
_classes = _lexeme[SUB_CATEGORY_2];
_senses = _classes[SUB_CATEGORY_3];
_subsenses = _senses[SUB_CATEGORY_4];


var output = {
  factory: _lexiconFactory,
  lexiconMixin: lexicon.mixin,
  lexemeMixin: _lexeme.mixin,
  classMixin: _classes.mixin,
  senseMixin: _senses.mixin,
};

// Helper functions
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