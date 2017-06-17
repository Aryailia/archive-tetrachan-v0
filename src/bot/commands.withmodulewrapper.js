'use strict';

const fs = require('fs');
const path = require('path');
const botWrapper = require('botwrapper');
//const unicode = require(path.resolve('./src/core/unicode.js'));
//const languages = require('./bot/languages.json');
const IS_DEVELOPMENT = process.argv[2].trim().toLowerCase() === 'development';

console.log(botWrapper);
module.exports = {};



const dynamicImports = botWrapper.conditionalLoader(IS_DEVELOPMENT, {
  dictionary: path.resolve('./src/core/dictionary.js')
});
dynamicImports.staticLoadIfNotDev();

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
  const url = 'http://jisho.org/api/v1/search/words?keyword=';
  //const wordList = dictionary();
  //console.log(imports.dictionary);
  //wordList.onlineSearch(text, url, function (url) {
  //  return Promise.resolve('asdf');
  //});
  message.channel.send('yo');
});
addCommand('en]jp', '', function (parameter, message) {
  commands.jisho(parameter, message);
});
addCommand('jp]en', '', commands.jisho);

function addCommand(command, documentation, fn) {
  if (IS_DEVELOPMENT) {
    commands[command] = function () {
      //console.log(arguments);
      Promise.all(dynamicImports.dynamicLoadIfDev()).then(function () {
        fn.apply(null, arguments);
      });
    };
    
  } else {
    commands[command] = fn;
  }
}

module.exports = commands;//*/