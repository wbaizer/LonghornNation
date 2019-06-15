const Discord = require('Discord.js');
const messageHandler = require('./messageHandler.js')

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
  messageHandler(message);
});

client.login(process.env.BOT_TOKEN);