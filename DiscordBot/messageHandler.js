const discordCommands = require('./commands');
const discordMacroHandler = require('./discordMacroHandler');
const discordAddMacroHandler = require('./discordAddMacroHandler');

const discordMessageHandler = (message) => {
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
    message.author.send(discordCommand.description);
  } else {
    const {
      ADD_MACRO,
      MACRO
    } = discordCommands;
    switch (command) {
      case ADD_MACRO.command: 
        discordAddMacroHandler(args, message);
        break;
      case MACRO.command:
        discordMacroHandler(args, message);
        break;
      default:
        message.channel.send(
          "That's not a valid command! I'll PM you a list of commands if you message '.m help'"
        );
    }
  }
};

module.exports = discordMessageHandler;
