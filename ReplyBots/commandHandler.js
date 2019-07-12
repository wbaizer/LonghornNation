const discordCommands = require('./commands');
const macroHandler = require('./macroHandler');
const addMacroHandler = require('./addMacroHandler');
const texasHandler = require('./texasHandler');
const ouTimeHandler = require('./ouTimeHandler');
const iPhoneHandler = require('./iPhoneHandler');
const easterEggHandler = require('./easterEggHandler');
const playerInfoHandler = require('./playerInfoHandler');
const scoreHandler = require('./scoreHandler');
const helpHandler = require('./helpHandler');

const commandHandler = (message, reply, privateReply, isMessageFromMod) => {
  const commandPrefix = ".";
  
  easterEggHandler(message, reply);
  
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
  } else if (command.length > 0 && command.charAt(0) === "."){
    return;
  }
  else {
    const {
      ADD_MACRO,
      HELP,
      IPHONE,
      MACRO,
      PLAYER_INFO,
      SCORE,
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
      case HELP.command:
        helpHandler(privateReply);
        break;
      case IPHONE.command:
        iPhoneHandler(reply);
        break;
      case MACRO.command:
        macroHandler(
          args, 
          privateReply,
          reply,
        );
        break;
      case PLAYER_INFO.command:
        playerInfoHandler(args, reply);
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
      case SCORE.command:
        scoreHandler(reply);
        break;
      default:
        reply(
          "That's not a valid command! I'll PM you a list of commands if you message '.help'"
        );
    }
  }
}

module.exports = commandHandler;