'use strict';

const IS_DEVELOPMENT = process.argv[2] &&
  process.argv[2].trim().toLowerCase() === 'development'; 

const http = require('http');
const dictionary = require('../core/dictionaries.js');
//const unicode = require(path.resolve('./src/core/unicode.js'));
const $ = require('../../lib/Compose/compose.js');
//const languages = require('./bot/languages.json');

// Check if dynamic load ever fucks up
if (IS_DEVELOPMENT &&
    !dictionary.toString().startsWith('function _lexiconFactory()')) {
  console.log(dictionary.toString());
  throw new SyntaxError('Dictionary: import failing');
}

const commands = {
  ping: function (parameter, message) {
    message.channel.send('pong');
  },

  oed: function () {

  },
  //en: commands.oed,

  jp: function () {
  },
};

addCommand('jisho', '', function (text, message) {
  dictionary().searchOnline('jisho', text, onlineRequest)
    .then(function (readingList) { // Process readingList structure
      return $(readingList.list)
        //.filter(function (entry) {
        //  entry.reading ===
        //
        //})
        .map(function (entry) {
          const reading = entry.word == undefined
            ? `**${entry.reading}**`
            : `**${entry.word}** (${entry.reading})`;
          
          const partsOfSpeech = $(entry.classes.list).map(function (group) {
            const category = `**${group.category}**`;
            const definitions = $.map(function (meaning, index) {
              return `${index + 1}. ${meaning}`;
            }, group.definitions.list).join('\n');

            return category + '\n' + definitions;
          }).value().join('\n');

          return reading + '\n' + partsOfSpeech;
        }).value().join('\n\n');
    })
    .then(function (str) { // Output
      //console.log(str);
      //wrapper.massMessage(str, message.channel.send);
      message.channel.send(str);
    }).catch(function (err) {
      console.error(err);
    });
});
addCommand('en]jp', '', function (parameter, message) {
  commands.jisho(parameter, message);
});
addCommand('jp]en', '', commands.jisho);

function addCommand(command, documentation, fn) {
  if (IS_DEVELOPMENT) {
    commands[command] = function (...args) {
      //console.log(args);
      //dynamicImports.dynamicLoadIfDev();
      fn.apply(null, args);
    };
  } else {
    commands[command] = fn;
  }
}

function onlineRequest(url) {
  var request = new Promise(function (resolve, reject) {
    http.get(//{
      url,
  //    host: 'jisho.org',
  //    path: '/api/v1/search/words?keyword=' + encodeURIComponent(text)
    //}, 
    function(response) {
      var body = ''; // Continuously update stream with data
      response.on('data', function(data) {
        body += data;
      });
      response.on('end', function() {
        resolve(body);
      });
    });
  });
  return request;
}

module.exports = commands;