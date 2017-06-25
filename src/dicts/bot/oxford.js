const config = require('../../../personal/discordconfig.json');

const _oxfordHeaders = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': 0,
    Accept: 'application/json',
    app_id: config.oed_application_id,
    app_key: config.oed_application_key,
  },
};

function oxfordEnglish(results, text, fetcher) {
  const url = 'https://od-api.oxforddictionaries.com:443/api/v1/entries/en/';
  return(fetcher(url + encodeURIComponent(text), _oxfordHeaders)
    .then(function (response) { return JSON.parse(response); })
    .then(function (data) {
      data.results.forEach(function (result) {
        const lexeme = results.add({
          word: result.word,
        });
        result.lexicalEntries.forEach(function (lexicalEntry) {
          const category = lexeme.classes.add({
            category: lexicalEntry.lexicalCategory,
          });
          lexicalEntry.entries.forEach(function (entry) {
            entry.senses.forEach(function (sense) { // Not sure when we get
              if (sense.hasOwnProperty('definitions')) { // Normal Case
                category.senses.add({
                  meaning: sense.definitions.join('; '),
                  examples: sense.examples,
                });
              } else if (sense.hasOwnProperty('crossReferenceMarkers')) { // Non-standard case
                category.senses.add({
                  meaning: sense.crossReferenceMarkers.join('; '),
                  examples: sense.examples,
                });
              }
              if (sense.hasOwnProperty('subsenses')) { // Not sure what subsenses are for
                sense.subsenses.forEach(function (subsense) {
                  category.senses.add({
                    meaning: subsense.definitions.join('; '),
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

module.exports = oxfordEnglish;