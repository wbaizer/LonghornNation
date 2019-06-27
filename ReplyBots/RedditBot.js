const BOT_START = Date.now() / 1000;
const Snoowrap = require('snoowrap');
const { CommentStream } = require('snoostorm');
const commandHandler = require('./commandHandler');

const client = new Snoowrap({
    userAgent: 'my-node-js-bot',
    clientId: process.env.REDDIT_KEY,
    clientSecret: process.env.REDDIT_SECRET,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
});

const isBot = (msg) => {
  return msg != null && msg.toLower
}

const comments = new CommentStream(client, { 
    subreddit: process.env.SUBREDDIT, 
    limit: 10, 
    pollTime: 10000 
});

comments.on('item', (item) => {
    if(item.created_utc < BOT_START || item.author.name.toLowerCase() === process.env.USERNAME.toLowerCase()){ 
      return;
    }
    
    const reply = (text) => {
      item.reply(text);
    }
    
    commandHandler(
      item.body, 
      reply, 
      (message) => {
        client.composeMessage({
          to: item.author.name,
          subject: "Beep boop: message from longhornmod",
          text: message,
        })
      },
      // TODO: implement this as well
      false, // determine if it's a mod sending message
    );
});