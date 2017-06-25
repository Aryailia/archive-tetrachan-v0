//http://www.unicode.org/cgi-bin/GetUnihanData.pl?codepoint=
//https://github.com/goldendict/goldendict
//https://github.com/attgm/kotonoko
//https://github.com/fujii/qolibri
//https://github.com/sina-ht/ebview
//http://rtkwiki.koohii.com/wiki/EPWING_software
//https://github.com/FooSoft/yomichan-import
//https://foosoft.net/projects/yomichan-import/
//https://github.com/ff-addons/rikaisama
//https://github.com/goldendict/goldendict/issues/298
//https://github.com/cyndis/epwing.rs

//JMDict
//http://ftp.monash.edu.au/pub/nihongo/00INDEX.html
//CC-CEDICT
//http://cantonese.org/download.html

'use strict';

const dicts = require('../core/dictionaries.js');

const fs = require('fs');
const Url = require('url');
//const util = require('util');
const $ = require('../../lib/Compose/compose.js');
const botwrapper = require('../../lib/bothelpers/botwrapper.js');
const Protocol = {
  'http:': require('http'),
  'https:': require('https'),
//  'http:': require('follow-redirects/http'),
//  'https:': require('follow-redirects/https'),
};

// Dictionaries
dicts.web.oxford = require('../dicts/bot/oxford.js');


// Other commands
dicts.onlineDictionaryCommand = function (name) {
  return function (text, message) {
    (dicts.onlineLookup(name, text, '', dicts.onlineRequest)
      .then(function (readingList) {
        const str =  dicts.formatAPI(readingList).join('\n\n');
        botwrapper.massMessage([str], message.channel);
      }).catch(function (err) {
        console.error(err);
      })
    );
  };
};

dicts.offlineDictionaryCommand = function () {
  return function (text, message) {
    (dicts.offlineLookup('cedict', text, '', dicts.offlineRequest)
      .then(function (readingList) {
        const str = dicts.formatAPI(readingList).join('\n\n');
        botwrapper.massMessage([str], message.channel);
      }).catch(function (err) {
        console.error(err);
      })
    );
  };
};

dicts.formatAPI = function (apiOutput) {
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
};

dicts.offlineRequest = function (processBuffer) {
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
};

const requestDefaults = {
  method: 'GET',
  headers: {},
};

dicts.onlineRequest = function (requestUrl, options) {
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
};



module.exports = dicts;