/**
 * Add commands by giving the format
 * COMMAND_NAME: {command: "whattheusertypes",
 * description: "A message to help the user if they need help with this command"}
 */

const discordCommands = {
  MACRO: {
    command: 'm',
    description: "When you send the m command, BevoBot will reply with a " +
      " picture. You can see valid arguments by sending '.m list'"
  },
};

module.exports = discordCommands;