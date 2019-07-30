const Discord = require('discord.js');
const Twitter = require('twitter');
const snoowrap = require('snoowrap');

const reddit = new snoowrap({
    userAgent: '/r/LHN BatmanBot',
    clientId: process.env.REDDIT_KEY,
    clientSecret: process.env.REDDIT_SECRET,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
  });

const discord = new Discord.Client();

const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const params = {
  follow: "883792173698879488",
};

const discordSendMessage = (channel, message) => {
  discord.on('ready', () => {
    const chan = discord.channels.get(channel);
    chan.send(message);
  });
}

discord.on('ready', () => {
  var stream = client.stream('statuses/filter', params, (stream) => {
    stream.on('data', function(event) {
      if (event != null) {
        const url = `https://twitter.com/${event.user.screen_name}/status/${event.id_str}`;
        let chan = discord.channels.get("601575968804700160");
        chan.send(url);
      }
    });
  });
});

discord.login(process.env.BOT_TOKEN);

