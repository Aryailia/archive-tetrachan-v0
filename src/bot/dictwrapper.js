var util = require('util');
const dicts = require('../core/dictionaries.js');
const config = require('../../personal/discordconfig.json');

const _oxfordHeaders = {
  port: 443,
  headers: {
    Accept: 'application/json',
    app_id: config.oed_application_id,
    app_key: config.oed_application_key,
  },
};

dicts.web.oxford = function (list, text, fetcher) {
  var url = 'https://od-api.oxforddictionaries.com/api/v1/entries/en/';
  return(fetcher(url + encodeURIComponent(text), _oxfordHeaders)
    .then(dicts.processJson)
    .then(function (data) {
      //data.results
      console.log(util.inspect(data, { showHidden: false, depth: null }));
      //console.log(data);
    }).catch(dicts.processError)
  );
};

module.exports = dicts;