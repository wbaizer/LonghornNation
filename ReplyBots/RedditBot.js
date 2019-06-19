const BOT_START = Date.now() / 1000;
const Snoowrap = require('snoowrap');
const { CommentStream } = require('snoostorm');
const macroHandler = require('./macroHandler');
const commands = require('./commands');
const texasHandler = require('./texasHandler');
const ouTimeHandler = require('./ouTimeHandler');

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
    if(item.created_utc < BOT_START) return;
    const commandPrefix = ".";

    // Ignore messages not starting with the prefix (in config.json)
    if (item.body.indexOf(commandPrefix) !== 0) {
      return;
    }

    // Our standard argument/command name definition.
    const args = item.body.slice(commandPrefix.length).trim().split(
      / +/g);
    const command = args.shift().toLowerCase();
    
    const {
      MACRO,
      TEXAS,
      TIME,
    } = commands;
    
    const reply = (text) => {
      item.reply(text);
    }
    
    switch (command) {
      case MACRO.command:
        macroHandler(
          args, 
          () => {},
          reply,
        );
        break;
      case TEXAS.command:
        texasHandler(reply);
        break;
      case TIME.command:
        ouTimeHandler(
          reply,
        );
        break;
      default:
    }
});