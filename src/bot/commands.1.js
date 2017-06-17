'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const botWrapper = require('botwrapper');
//const unicode = require(path.resolve('./src/core/unicode.js'));
//const languages = require('./bot/languages.json');
const IS_DEVELOPMENT = process.argv[2].trim().toLowerCase() === 'development';

//Test

let dynamicImports;
if (botWrapper.hasOwnProperty('conditionalLoader')) {
  dynamicImports = botWrapper.conditionalLoader(IS_DEVELOPMENT, {
    dictionary: path.resolve('./src/core/dictionary.js')
  });
  dynamicImports.staticLoadIfNotDev();
} else {
  console.log('Testing if this gets rewritten', botWrapper);
}


const imports = IS_DEVELOPMENT
  ? Object.create(null)
  : {
    dictionary: require(path.resolve('./src/core/dictionary.js'))
  };

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
  //const url = 'http://jisho.org/api/v1/search/words?keyword=';
  var wordList = imports.dictionary();
  wordList.searchOnline('jisho', text, onlineRequest);
  /*wordList.onlineSearch(text, url, function (url) {
    return Promise.resolve('asdf');
  });
  message.channel.send('yo');*/
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
      Promise.all(dynamicLoadIfDev(IS_DEVELOPMENT, imports, {
        dictionary: './src/core/dictionary.js'
      })).then(function () {
        //console.log(args);
        fn.apply(null, args);
      });
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

function dynamicLoadIfDev(isDev, codeContainer, path) {
  return(isDev
    ? Object.keys(path).map(
      function (modName) {
        const load = {};
        const loadPromise = new Promise(function (resolve, reject) {
          load.resolve = resolve;
          load.reject  = reject;
        });

        fs.readFile(path[modName], 'utf8', function (err, data) {
          if (err) {
            load.reject(err); // Load fail
          } else {
            try { // Test any problems in code
              codeContainer[modName] = eval(data);
              load.resolve(); // And signal commands loaded
            } catch (e) { // Fail if there are any
              load.reject(e); // Load fail
            }
          }
        });
        return loadPromise;
      })
    : [Promise.resolve()]
  );
}

module.exports = commands;