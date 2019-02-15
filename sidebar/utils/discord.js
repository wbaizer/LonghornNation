const moment = require('moment');
const {
  Client,
  RichEmbed
} = require('discord.js');
const client = new Client();
const messageHandler = require('../utils/discord_utils/messageHandler');

function message(channel, status, message) {
  client.on('ready', () => {
    var date = moment(Date.now()).format('M/D/Y hh:mm A');
    var statusColor = 0xbd7500;
    if (status) {
      statusColor = 0xFF0000;
    }
    var generalChannel = client.channels.get(channel);
    const embed = new RichEmbed()
      .setTitle(process.env.SUBREDDIT)
      .setColor(statusColor)
      .setDescription(message)
      .setTimestamp(date);
    generalChannel.send(embed);
  });

}

client.login(process.env.BOT_TOKEN);

client.on('message', messageHandler);

module.exports = {
  message,
  client
};
