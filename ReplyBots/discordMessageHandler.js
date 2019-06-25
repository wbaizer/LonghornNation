const commandHandler = require('./commandHandler');

const ELIGIBLE_ROLES = ['Mods', 'Coders'];

const discordMessageHandler = (message) => {
  const channelSend = (text) => {
    message.channel.send(text);
  };

  // Ignore all bots.
  if (message.author.bot) {
    return;
  }
  
  const matchedEligibleRoles = 
    message
      .member
      .roles
      .filter(
        r => ELIGIBLE_ROLES.indexOf(r.name) >= 0
      );
  
  commandHandler(
    message.content, 
    channelSend, 
    (text) => {
      message.author.send(text)
    },
    Array.from(matchedEligibleRoles).length > 0,
  );
};

module.exports = discordMessageHandler;
