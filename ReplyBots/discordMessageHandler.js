const discordCommands = require('./commands');
const macroHandler = require('./macroHandler');
const addMacroHandler = require('./addMacroHandler');
const texasHandler = require('./texasHandler');
const ouTimeHandler = require('./ouTimeHandler');

const ELIGIBLE_ROLES = ['Mods', 'Coders'];


const discordMessageHandler = (message) => {
  const channelSend = (text) => {
    message.channel.send(text);
  };

  // Ignore all bots.
  if (message.author.bot) {
    return;
  }

  const commandPrefix = ".";

  // Ignore messages not starting with the prefix (in config.json)
  if (message.content.indexOf(commandPrefix) !== 0) {
    return;
  }

  // Our standard argument/command name definition.
  const args = message.content.slice(commandPrefix.length).trim().split(
    / +/g);
  const command = args.shift().toLowerCase();

  if (args.length > 0 && args[0] === 'help') {
    // send a pm for help
    const discordCommand = Object.values(discordCommands).find(val =>
      val.command === command
    );
    if (discordCommand != null) {
      message.author.send(discordCommand.description);
    }
  } else {
    const {
      ADD_MACRO,
      MACRO,
      TEXAS,
      TIME,
    } = discordCommands;
    switch (command) {
      case ADD_MACRO.command: 
        const matchedEligibleRoles = message.member.roles.filter(r => ELIGIBLE_ROLES.indexOf(r.name) >= 0);
      
        if (Array.from(matchedEligibleRoles).length > 0) {
          addMacroHandler(args, channelSend);
        } else {
          channelSend('You are not allowed to do this');
        }
        break;
      case MACRO.command:
        macroHandler(
          args, 
          (text) => {message.author.send(text)},
          channelSend,
        );
        break;
      case TEXAS.command:
        texasHandler(
          channelSend,
        );
        break;
      case TIME.command:
        ouTimeHandler(
          channelSend,
        );
        break;
      default:
        message.channel.send(
          "That's not a valid command! I'll PM you a list of commands if you message '.m help'"
        );
    }
  }
};

module.exports = discordMessageHandler;
