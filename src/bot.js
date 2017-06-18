'use strict';

const path = require('path');
//const Discord = require('discord.js');
const Discord = require('../lib/bothelpers/psuedodiscord.js');
const config = require('../personal/discordconfig.json');
const wrapper = require('../lib/bothelpers/botwrapper.js');
const IS_DEVELOPMENT = process.argv[2] &&
  process.argv[2].trim().toLowerCase() === 'development';

// If development, allow dynamically load commands at runtime for rapid testing
const extraModules = wrapper.conditionalLoader(IS_DEVELOPMENT, {
  commands: path.resolve('./src/bot/commands.js'),
  unicode: path.resolve('./src/core/unicode.js'),
});
// If {IS_DEVELOPMENT} then read code from file on every command execution
// else if production then just load the code once
extraModules.staticLoadIfNotDev();

if (IS_DEVELOPMENT) {
  const echoer = new Discord.Client();
  echoer.login(config.echoer_token);
  echoer.on('ready', () => console.log('Echoer is ready'));
  echoer.on('message', (message) => {
    const capture = /^=echo (.+)/.exec(message.content);
    if (capture !== null && !message.author.bot) {
      message.channel.send(capture[1]);
    }
  });
}

const client = new Discord.Client();
client.login(config.bot_token);

// Ready
client.on('ready', () => {
  console.log('Tetra Bot is ready.');
  
  //bot.getAllUsers((err) => {
  //  if(err) {
  //    console.log(err);
  //  }
  //});
});

client.on('message', function(message) {
  const match = wrapper.checkCommandFormat(config.prefix).exec(message.content);
  if (match === null) return; // Not a valid command format
  
  extraModules.dynamicLoadIfDev();
  const command = extraModules.unicode.sanitize(match[1]);
  const parameter = extraModules.unicode.sanitize(match[2] == undefined
    ? ''
    : match[2]);
  
  if (IS_DEVELOPMENT) {
    console.log('command: ', match[1], '-', command);
    console.log('parameter: ', match[2], '-', parameter);
  }
  if (extraModules.commands.hasOwnProperty(command)) {
    extraModules.commands[command](parameter, message);
  }
  
});//*/