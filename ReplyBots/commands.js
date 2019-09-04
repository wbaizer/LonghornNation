/**
 * Add commands by giving the format
 * COMMAND_NAME: {command: "whattheusertypes",
 * description: "A message to help the user if they need help with this command"}
 */

const discordCommands = {
  ADD_MACRO: {
    command: 'add_macro',
    description: 'adds a macro if you are a mod or coder. first arg is new macro name' +
      " second arg is macro contents",
  },
  HELP: {
    command: 'help',
    description: 'gives info on what the bot can do',
  },
  IPHONE: {
    command: 'iphone',
    description: 'Sends the infamous copypasta',
  },
  MACRO: {
    command: 'm',
    description: "When you send the m command, BevoBot will reply with a " +
      " picture. You can see valid arguments by sending '.m list'"
  },
  PLAYER_INFO: {
    command: 'player_info',
    description: "Given a name or a number, bot will tell you basic info about a player",
  },
  SCORE: {
    command: 'score',
    description: 'gets score information for big 12 games this week',
  },
  TEXAS: {
    command: 'texas',
    description: "bot will respond with FIGHT!",
  },
  TIME: {
    command: 'what_time',
    description: "bot will reply with 'Its x:xx in Austin, Texas and OU still sucks!'",
  },
};

module.exports = discordCommands;