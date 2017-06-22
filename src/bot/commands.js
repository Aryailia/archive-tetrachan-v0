'use strict';

const IS_DEVELOPMENT = process.argv[2] &&
  process.argv[2].trim().toLowerCase() === 'development'; 

const fs =require('fs');
const Url = require('url');
//const Protocol = {
//  'https:': require('follow-redirects/https'),
//  'http:': require('follow-redirects/http'),
//};
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
  Dictionaries.onlineLookup('jisho', text, '', _onlineRequest)
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
  Dictionaries.onlineLookup('oxford', text, '', _onlineRequest)
    .then(function (readingList) { // Process readingList structure
      return _formatAPI(readingList).join('\n\n');
    }).then(function (str) { // Output
      //wrapper.massMessage(str, message.channel.send);
      message.channel.send(str);
    }).catch(function (err) {
      console.error(err);
    });
});


_addCommand('goo', '', function (text, message) {
  // https://dictionary.goo.ne.jp/freewordsearcher.html?MT=君&mode=1&kind=jn
  Dictionaries.onlineLookup('goo', text, '', _onlineRequest)
    //.then(function (readingList) { // Process readingList structure
    //  return _formatAPI(readingList).join('\n\n');
        //.filter(function (entry) {
        //  entry.reading ===
        //
        //})
    //})
    .then(function (str) { // Output
      //wrapper.massMessage(str, message.channel.send);
      //message.channel.send(str);
    }).catch(function (err) {
      console.error(err);
    });
});

_addCommand('cedict', '', function (text, message) {
  Dictionaries.offlineLookup('cedict', text, '', _offlineLoad)
    .then(function (readingList) { // Process readingList structure
      return _formatAPI(readingList).join('\n\n');
    }).then(function (str) { // Output
      //wrapper.massMessage(str, message.channel.send);
      //console.log(str);
      message.channel.send(str);
    }).catch(function (err) {
      console.error(err);
    });
});

function _offlineLoad(processBuffer) {
  return new Promise(function (resolve, reject) {
    const stream = fs.createReadStream('./dicts/cedict_ts-2017-06-19.u8');
    let last = '';
    stream.setEncoding('utf8');
    stream.on('data', function (chunk) {
      processBuffer(last, chunk);
      last = chunk;
    });
    stream.on('end', function () {
      resolve();
    });
  });
}


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
      const definitions = $.map(function (definition, index) {
        return `${index + 1}. ${definition.sense}`;
      }, group.definitions.list).join('\n');

      return category + '\n' + definitions;
    }).value().join('\n');
    return reading + '\n' + partsOfSpeech;
  }).value();
}

const requestDefaults = {
  method: 'GET',
  headers: {},
};

function _onlineRequest(requestUrl, options) {
  const urlObj = Url.parse(requestUrl);
  return new Promise(function (resolve, reject) {
    const headers = Utils.settingsOver(requestDefaults, options);
    headers.port = urlObj.port; // Deferring port setting to the URL
    headers.hostname = urlObj.hostname;
    headers.path = urlObj.path;
    
    Protocol[urlObj.protocol].get(headers, function(response) {
      response.setEncoding('utf8');
      if (response.statusCode === 200) {
        var body = '';
        response.on('data', function (data) {
          body += data;
        }).on('end',function () {
          resolve(body);
        }).on('error',function (error) { // receive error (not sure this is needed)
          reject(error);
        });
      } else { // Bad error code
        reject(`Error code ${response.statusCode}`);
      }
    }).on('error', function (error) { // send error
      reject(error);
    });
  });
}

module.exports = commands;