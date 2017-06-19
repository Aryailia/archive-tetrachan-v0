'use strict';

const IS_DEVELOPMENT = process.argv[2] &&
  process.argv[2].trim().toLowerCase() === 'development'; 

const Url = require('url');
const Protocol = {
  'https:': require('https'),
  'http:': require('http'),
};
const Utils = require('../core/utils.js');
const Dictionaries = require('./dictwrapper.js');
//const unicode = require(path.resolve('./src/core/unicode.js'));
const $ = require('../../lib/Compose/compose.js');
//const languages = require('./bot/languages.json');

const commands = {
  ping: function (parameter, message) {
    message.channel.send('pong');
  },
  //en: commands.oed,

  jp: function () {
  },
};

_addCommand('jisho', '', function (text, message) {
  Dictionaries.onlineLookup('jisho', text, _onlineRequest)
    .then(function (readingList) { // Process readingList structure
      return _formatAPI(readingList).join('\n\n');
        //.filter(function (entry) {
        //  entry.reading ===
        //
        //})
    }).then(function (str) { // Output
      //wrapper.massMessage(str, message.channel.send);
      message.channel.send(str);
    }).catch(function (err) {
      console.error(err);
    });
});
_addCommand('en]jp', '', function (parameter, message) {
  commands.jisho(parameter, message);
});
_addCommand('jp]en', '', commands.jisho);

_addCommand('oed', '', function (text, message) {
  Dictionaries.onlineLookup('oxford', text, _onlineRequest);
});

function _addCommand(command, documentation, fn) {
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

function _formatAPI(apiOutput) {
  return $(apiOutput.list).map(function (entry) {
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
  }).value();
}

const requestDefaults = {
  port: 80,
  method: 'GET',
  headers: {},
};

function _onlineRequest(requestUrl, options) {
  const urlObj = Url.parse(requestUrl);
  const request = new Promise(function (resolve, reject) {
    const headers = Utils.settingsOver(requestDefaults, options);
    headers.hostname = urlObj.hostname;
    headers.path = urlObj.path;
    
    Protocol[urlObj.protocol].get(headers, function(response) {
      if (response.statusCode == 200) {
        var body = '';
        response.on('data', function (data) {
          body += data;
        }).on('end',function () {
          resolve(body);
        }).on('error',function(err){
          console.error(err);
          reject(err);
        });
      } else {
        reject(`${response.statusCode}: No such entry found`);
      }
    });
  });
  return request;
}

module.exports = commands;