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
const botwrapper = require('../../lib/bothelpers/botwrapper.js');
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

_addCommand('weblio', '', function (text, message) {
  Dictionaries.onlineLookup('weblio', text, '', _onlineRequest)
    .then(function (readingList) { // Process readingList structure
      return _formatAPI(readingList).join('\n=========\n');
    }).then(function (str) { // Output
      botwrapper.massMessage([str], message.channel);
      //message.channel.send(str);
    }).catch(function (err) {
      console.error(err);
    });
});

_addCommand('oed', '', function (text, message) {
  Dictionaries.onlineLookup('oxford', text, '', _onlineRequest)
    .then(function (readingList) { // Process readingList structure
      return _formatAPI(readingList).join('\n\n');
    }).then(function (str) { // Output
      //botwrapper.massMessage(str, message.channel.send);
      message.channel.send(str);
    }).catch(function (err) {
      console.error(err);
    });
});

_addCommand('so-mdbg', '', function (text, message) {
  Dictionaries.onlineLookup('so-mdbg', text, '', _onlineRequest)
    .then(function (str) { // Process readingList structure
      var url = 'https://www.mdbg.net/chinese/rsc/img/stroke_anim/' + text.charCodeAt(0) +  '.gif';
      message.channel.send({ file: url, });
    }).catch(function (err) {
      message.channel.send(`Cannot find stroke order image for '${text}' on MDBG`);
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
  return $(apiOutput.list).map(function (lexeme) {
    const reading = lexeme.reading == undefined || lexeme.reading === ''
      ? `**${lexeme.word}**`
      : `**${lexeme.word}** (${lexeme.reading})`;
    
    const wordClassCluster = $(lexeme.classes.list).map(function (wordClass) {
      const partOfSpeech = wordClass.category.trim() == ''
        ? '***Unknown***'
        : `***${wordClass.category.trim()}***`;
      const senses = $.map(function (sense, i) {
        const subsenseCluster = $.map(function (subsenseObj, j) {
          return `\u3000\u3000${i + 1}.${j + 1}. ${subsenseObj.subsense}`;
        }, sense.subsenses.list).join('\n');
        const subsenseString = subsenseCluster.length > 0
          ? `${subsenseCluster}\n`
          : subsenseCluster;

        return `${i + 1}. ${sense.sense}\n${subsenseString}`;
      }, wordClass.senses.list).join('\n');

      return partOfSpeech + '\n' + senses;
    }).value().join('\n');
    return reading + '\n' + wordClassCluster;
  }).value();
}

const requestDefaults = {
  method: 'GET',
  headers: {},
};

function _onlineRequest(requestUrl, options) {
  const urlObj = Url.parse(requestUrl);
  return new Promise(function (resolve, reject) {
    const headers = botwrapper.imposeKeyValueStructure(requestDefaults, options);
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