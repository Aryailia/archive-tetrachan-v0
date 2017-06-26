'use strict';

const IS_DEVELOPMENT = process.argv[2] &&
  process.argv[2].trim().toLowerCase() === 'development'; 

const botwrapper = require('../../lib/bothelpers/botwrapper.js');
const config = require('../../personal/discordconfig.json');
const Dictionaries = require('./dictwrapper.js');
//const $ = require('../../lib/Compose/compose.js');

const library = botwrapper.setupCommands(
  function (lib, name, text, message) {
    return true;
  },
  config.prefix
);

const commands = library.commands;
library.addCommand('help', ['Miscellaneous'], ' [<commandName>]',
  'Displays the help information. Can also use the -h tag on specific functions',
  'Something',
  function (text, message) {
    botwrapper.defaultHelp(library, true, true, text, message.channel);
  }
);

library.addCommand('ping', ['Miscellaneous'], '',
  'Just an innocent test function. Expected response is pong',
  'Just an innocent test function. Expected response is pong',
  function (text, message) {
    message.channel.send('pong');
  }
);

library.addCommand('jisho', ['Japanese', 'English'], ' <text>',
  'JP-EN dictionary. Searches Jisho.org for <text>',
  `Searches Japanese-English dictionary Jisho.jp for <text>
  - Quotes for exact match
  - `,
  Dictionaries.onlineDictionaryCommand('jisho')
);
library.addCommand('en]jp', ['Japanese'], ' <text>',
  `See ${config.prefix}jisho -h`,
  'Jisho alias. Adds quotation marks to search.',
  function (parameter, message) {
    commands.jisho(`"${parameter}"`, message);
  }
);

library.addCommand('jp]en', ['Japanese'], ' <text>',
  `See ${config.prefix}jisho -h`,
  'Jisho alias.',
  library.commands.jisho
);

library.addCommand('weblio', ['Japanese'], ' <text>',
  'Online mono JP dictionary. Searches Weblio.jp for <text>',
  `Searches Japanese dictionary Weblio.jp for <text>
  `,
  Dictionaries.onlineDictionaryCommand('weblio')
);

library.addCommand('oed', ['English'], ' <text>',
  'Online mono EN dictionary. Searches Oxford for <text>',
  `Searches Japanese dictionary, Weblio.jp, for <text>
  Note: that this bot is on the free plan and has a limit of 3000 requests per month`,
  Dictionaries.onlineDictionaryCommand('oxford')
);

library.addCommand('cedict', ['English', 'Mandarin'], ' <text>',
  'ZH-EN dictionary. Searches the CEDICT for <text>',
  `Searches Mandarin-English dictionary, Creative Common's Chinese-English Dictionary, for <text>
  `,
  Dictionaries.offlineDictionaryCommand('cedict')
);

/**
 * @todo Error checking for lack of permissions
 */
library.addCommand('so-mdbg', ['Stroke Order', 'PRC'], ' <text>',
  'PRC? stroke order. Searches the MDBG for <character>',
  `Searches MDBG dictionary for <character>
  `,
  function (text, message) {
    (Dictionaries.onlineLookup('so-mdbg', text, '', Dictionaries.onlineRequest)
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

library.addCommand('goo', ['Japanese'], ' <text>',
  'PRC? stroke order. Searches the MDBG for <character>',
  `Searches MDBG dictionary for <character>
  `,
  // https://dictionary.goo.ne.jp/freewordsearcher.html?MT=君&mode=1&kind=jn
  Dictionaries.onlineDictionaryCommand('goo')
);

module.exports = library.commands;