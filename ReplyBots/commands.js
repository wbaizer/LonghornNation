/**
 * Add commands by giving the format
 * COMMAND_NAME: {command: "whattheusertypes",
 * description: "A message to help the user if they need help with this command"}
 */

const discordCommands = {
  ADD_MACRO: {
    command: 'add_macro',
    description: 'adds a macro if you are allowed to. first arg is new macro name' +
      " second arg is macro contents",
  },
  MACRO: {
    command: 'm',
    description: "When you send the m command, BevoBot will reply with a " +
      " picture. You can see valid arguments by sending '.m list'"
  },
};

module.exports = discordCommands;