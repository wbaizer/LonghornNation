const commandHandler = require('./commandHandler');

const ELIGIBLE_ROLES = ['Mods', 'Coders'];

const discordMessageHandler = (message) => {
  try {
    const channelSend = (text) => {
      message.channel.send(text).catch(e => {
        channelSend("Something went wrong. Please try again. If this continues Please message /u/brihoang or /u/chrislabeard");
      });
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
  } catch(e) {
    message.author.send('Somethign went wrong. Please try again. if this persists, please meessage /u/brihoang or /u/chrislabeard');
  }
};

module.exports = discordMessageHandler;
