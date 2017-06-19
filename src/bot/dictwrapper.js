var util = require('util');
const dicts = require('../core/dictionaries.js');
const config = require('../../personal/discordconfig.json');
var $ = require('../../lib/Compose/compose.js');

const _oxfordHeaders = {
  port: 443,
  headers: {
    Accept: 'application/json',
    app_id: config.oed_application_id,
    app_key: config.oed_application_key,
  },
};

dicts.web.oxford = function (results, text, fetcher) {
  const url = 'https://od-api.oxforddictionaries.com/api/v1/entries/en/';
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
            entry.senses.forEach(function (sense) {
              console.log(sense.hasOwnProperty('definitions'));
              if (sense.hasOwnProperty('definitions')) {
                category.definitions.addDefinition({
                  sense: sense.definitions.join('; '),
                  examples: sense.examples,
                });
              } else if (sense.hasOwnProperty('crossReferenceMarkers')) {
                category.definitions.addDefinition({
                  sense: sense.crossReferenceMarkers.join('; '),
                  examples: sense.examples,
                });
              }
              if (sense.hasOwnProperty('subsenses')) {
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

      console.log(util.inspect(results, { showHidden: false, depth: null }));
      return results;
    }).catch(dicts.processError)
  );
};

module.exports = dicts;