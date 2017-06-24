const wrapper = require('../lib/bothelpers/botwrapper.js');
const structure = wrapper.setupCommand();

function _null() {}
structure.addCommand('help', ['Misc'], ' [<commandName>]',
  '',
  '',
  wrapper.makeDefaultHelpCommand(structure, true, true)
);

structure.addCommand('a1', ['Misc', 'a'], ' [<commandName>]', '', '', _null);
structure.addCommand('a2', ['b', 'a'], ' [<commandName>]', '', '', _null);
structure.addCommand('a3', ['Misc', 'a'], ' [<commandName>]', '', '', _null);
structure.addCommand('a4', ['d', 'b'], ' [<commandName>]', '', '', _null);
structure.addCommand('a5', ['d', 'a', 'b'], ' [<commandName>]', '', '', _null);
structure.addCommand('a6', ['c', 'a', 'b'], ' [<commandName>]', '', '', _null);

structure.commands.help('', {channel: {send: console.log}});