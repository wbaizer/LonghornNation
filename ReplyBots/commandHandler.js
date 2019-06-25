const discordCommands = require('./commands');
const macroHandler = require('./macroHandler');
const addMacroHandler = require('./addMacroHandler');
const texasHandler = require('./texasHandler');
const ouTimeHandler = require('./ouTimeHandler');

const commandHandler = (message, reply, privateReply, isMessageFromMod) => {
  const commandPrefix = ".";
  
  // Ignore messages not starting with the prefix (in config.json)
  if (message.indexOf(commandPrefix) !== 0) {
    return;
  }
  
  const args = message.slice(commandPrefix.length).trim().split(
    / +/g);
  
  const command = args.shift().toLowerCase();
  
  if (args.length > 0 && args[0] === 'help') {
    // send a pm for help
    const discordCommand = Object.values(discordCommands).find(val =>
      val.command === command
    );
    if (discordCommand != null) {
      privateReply(discordCommand.description);
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
        if (isMessageFromMod) {
          addMacroHandler(args, reply);
        } else {
          reply('You are not allowed to do this');
        }
        break;
      case MACRO.command:
        macroHandler(
          args, 
          privateReply,
          reply,
        );
        break;
      case TEXAS.command:
        texasHandler(
          reply,
        );
        break;
      case TIME.command:
        ouTimeHandler(
          reply,
        );
        break;
      default:
        reply(
          "That's not a valid command! I'll PM you a list of commands if you message '.m help'"
        );
    }
  }
}

module.exports = commandHandler;