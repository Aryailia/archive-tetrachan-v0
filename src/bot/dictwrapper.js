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

//var util = require('util');
const dicts = require('../core/dictionaries.js');
const config = require('../../personal/discordconfig.json');
var $ = require('../../lib/Compose/compose.js');

const _oxfordHeaders = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': 0,
    Accept: 'application/json',
    app_id: config.oed_application_id,
    app_key: config.oed_application_key,
  },
};

dicts.web.oxford = function (results, text, fetcher) {
  const url = 'https://od-api.oxforddictionaries.com:443/api/v1/entries/en/';
  return(fetcher(url + encodeURIComponent(text), _oxfordHeaders)
    .then(dicts.processJson)
    .then(function (data) {
      data.results.forEach(function (result) {
        const lexeme = results.addLexeme({
          word: result.word,
        });
        result.lexicalEntries.forEach(function (lexicalEntry) {
          const category = lexeme.classes.addClass({
            category: lexicalEntry.lexicalCategory,
          });
          lexicalEntry.entries.forEach(function (entry) {
            entry.senses.forEach(function (sense) { // Not sure when we get
              if (sense.hasOwnProperty('definitions')) { // Normal Case
                category.definitions.addDefinition({
                  sense: sense.definitions.join('; '),
                  examples: sense.examples,
                });
              } else if (sense.hasOwnProperty('crossReferenceMarkers')) { // Non-standard case
                category.definitions.addDefinition({
                  sense: sense.crossReferenceMarkers.join('; '),
                  examples: sense.examples,
                });
              }
              if (sense.hasOwnProperty('subsenses')) { // Not sure what subsenses are for
                sense.subsenses.forEach(function (subsense) {
                  category.definitions.addDefinition({
                    sense: subsense.definitions.join('; '),
                    examples: subsense.examples,
                  });
                });
              }
            });
          });
        });
      });
      //console.log(util.inspect(results, { showHidden: false, depth: null }));
      return results;
    })
  );
};

module.exports = dicts;