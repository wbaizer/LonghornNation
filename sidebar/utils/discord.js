const moment = require('moment');
const { Client, RichEmbed } = require('discord.js');
const client = new Client();

function message(channel, status, message) {
    var date = moment(Date.now()).format('M/D/Y hh:mm A');
    var statusColor = 0xbd7500;
    if(status) {
        statusColor = 0xFF0000;
    }
    client.on('ready', () => {
        var generalChannel = client.channels.get(channel);
        const embed = new RichEmbed()
          .setTitle(process.env.SUBREDDIT)
          .setColor(statusColor)
          .setDescription(message)
          .setTimestamp(date);
        generalChannel.send(embed);
      });
  
      client.login(process.env.BOT_TOKEN);    
}

module.exports = {
    message
};