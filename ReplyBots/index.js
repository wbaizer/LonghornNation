const Discord = require('Discord.js');
const discordMessageHandler = require('./discordMessageHandler.js')

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
  discordMessageHandler(message);
});

client.login(process.env.BOT_TOKEN);