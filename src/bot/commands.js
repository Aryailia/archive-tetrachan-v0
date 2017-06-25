'use strict';

const IS_DEVELOPMENT = process.argv[2] &&
  process.argv[2].trim().toLowerCase() === 'development'; 

const fs = require('fs');
const Url = require('url');

const botwrapper = require('../../lib/bothelpers/botwrapper.js');
const config = require('../../personal/discordconfig.json');

//const Protocol = {
//  'https:': require('follow-redirects/https'),
//  'http:': require('follow-redirects/http'),
//};
const Protocol = {
  'https:': require('https'),
  'http:': require('http'),
};

const Dictionaries = require('./dictwrapper.js');
const $ = require('../../lib/Compose/compose.js');
//const unicode = require(path.resolve('./src/core/unicode.js'));
//const languages = require('./bot/languages.json');

const structure = botwrapper.setupCommand(function (commandStructure, name) {
  return true;
}, config.prefix);

const commands = structure.commands;
structure.addCommand('help', ['Miscellaneous'], ' [<commandName>]',
  'Displays the help information. Can also use the -h tag on specific functions',
  'Something',
  botwrapper.makeDefaultHelpCommand(structure, true, true)
);

structure.addCommand('ping', ['Miscellaneous'], '',
  'Just an innocent test function. Expected response is pong',
  'Just an innocent test function. Expected response is pong',
  function (text, message) {
    message.channel.send('pong');
  }
);

structure.addCommand('jisho', ['Japanese', 'English'], ' <text>',
  'JP-EN dictionary. Searches Jisho.org for <text>',
  `Searches Japanese-English dictionary Jisho.jp for <text>
  - Quotes for exact match
  - `,
  function (text, message) {
    (Dictionaries.onlineLookup('jisho', text, '', _onlineRequest)
      .then(function (readingList) { // Process readingList structure
        return _formatAPI(readingList).join('\n\n');
      }).then(function (str) { // Output
        //wrapper.massMessage(str, message.channel.send);
        message.channel.send(str);
      }).catch(function (err) {
        console.error(err);
      })
    );
  }
);
structure.addCommand('en]jp', ['Japanese'], ' <text>',
  `See ${config.prefix}jisho -h`,
  'Jisho alias. Adds quotation marks to search.',
  function (parameter, message) {
    commands.jisho(`"${parameter}"`, message);
  }
);

structure.addCommand('jp]en', ['Japanese'], ' <text>',
  `See ${config.prefix}jisho -h`,
  'Jisho alias.',
  structure.commands.jisho
);

structure.addCommand('weblio', ['Japanese'], ' <text>',
  'Online mono JP dictionary. Searches Weblio.jp for <text>',
  `Searches Japanese dictionary Weblio.jp for <text>
  `,
  function (text, message) {
    (Dictionaries.onlineLookup('weblio', text, '', _onlineRequest)
      .then(function (readingList) { // Process readingList structure
        return _formatAPI(readingList).join('\n=========\n');
      }).then(function (str) { // Output
        botwrapper.massMessage([str], message.channel);
        //message.channel.send(str);
      }).catch(function (err) {
        console.error(err);
      })
    );
  }
);

structure.addCommand('oed', ['English'], ' <text>',
  'Online mono EN dictionary. Searches Oxford for <text>',
  `Searches Japanese dictionary, Weblio.jp, for <text>
  Note: that this bot is on the free plan and has a limit of 3000 requests per month`,
  function (text, message) {
    (Dictionaries.onlineLookup('oxford', text, '', _onlineRequest)
      .then(function (readingList) { // Process readingList structure
        return _formatAPI(readingList).join('\n\n');
      }).then(function (str) { // Output
        //botwrapper.massMessage(str, message.channel.send);
        message.channel.send(str);
      }).catch(function (err) {
        console.error(err);
      })
    );
  }
);

structure.addCommand('cedict', ['English', 'Mandarin'], ' <text>',
  'ZH-EN dictionary. Searches the CEDICT for <text>',
  `Searches Mandarin-English dictionary, Creative Common's Chinese-English Dictionary, for <text>
  `,
  function (text, message) {
    (Dictionaries.offlineLookup('cedict', text, '', _offlineLoad)
      .then(function (readingList) { // Process readingList structure
        return _formatAPI(readingList).join('\n\n');
      }).then(function (str) { // Output
        //wrapper.massMessage(str, message.channel.send);
        //console.log(str);
        message.channel.send(str);
      }).catch(function (err) {
        console.error(err);
      })
    );
  }
);

/**
 * @todo Error checking for lack of permissions
 */
structure.addCommand('so-mdbg', ['Stroke Order', 'PRC'], ' <text>',
  'PRC? stroke order. Searches the MDBG for <character>',
  `Searches MDBG dictionary for <character>
  `,
  function (text, message) {
    (Dictionaries.onlineLookup('so-mdbg', text, '', _onlineRequest)
      .then(function (str) { // Process readingList structure
        var url = 'https://www.mdbg.net/chinese/rsc/img/stroke_anim/' + text.charCodeAt(0) +  '.gif';
        message.channel.send({ file: url, });
      }).catch(function (err) {
        message.channel.send(`Cannot find stroke order image for '${text}' on MDBG`);
        console.error(err);
      })
    );
  }
);


structure.addCommand('goo', ['Japanese'], ' <text>',
  'PRC? stroke order. Searches the MDBG for <character>',
  `Searches MDBG dictionary for <character>
  `,
  function (text, message) {
    // https://dictionary.goo.ne.jp/freewordsearcher.html?MT=君&mode=1&kind=jn
    (Dictionaries.onlineLookup('goo', text, '', _onlineRequest)
      //.then(function (readingList) { // Process readingList structure
      //  return _formatAPI(readingList).join('\n\n');
      //})
      .then(function (str) { // Output
        //wrapper.massMessage(str, message.channel.send);
        //message.channel.send(str);
      }).catch(function (err) {
        console.error(err);
      })
    );
  }
);


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

function _formatAPI(apiOutput) {
  return $(apiOutput.list).map(function (lexeme) {
    const reading = lexeme.reading == undefined || lexeme.reading === ''
      ? `**${lexeme.word}**`
      : `**${lexeme.word}** (${lexeme.reading})`;
    
    const wordClassCluster = $(lexeme.classes.list).map(function (wordClass) {
      const partOfSpeech = wordClass.category.trim() == ''
        ? '__Unknown__'
        : `__${wordClass.category.trim()}__`;
      const senses = $.map(function (sense, i) {
        const subsenseCluster = $.map(function (subsenseObj, j) {
          return `\u3000\u3000${i + 1}.${j + 1}. ${subsenseObj.submeaning}`;
        }, sense.subsenses.list).join('\n');
        const subsenseString = subsenseCluster.length > 0
          ? `${subsenseCluster}\n`
          : subsenseCluster;

        return `${i + 1}. ${sense.meaning}\n${subsenseString}`;
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
    //console.log();
    const headers = $.defaults(requestDefaults, options == undefined ? {} : options, true);
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

module.exports = structure.commands;