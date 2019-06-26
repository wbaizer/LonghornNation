const discordCommands = require('./commands');
const macroHandler = require('./macroHandler');
const addMacroHandler = require('./addMacroHandler');
const texasHandler = require('./texasHandler');
const ouTimeHandler = require('./ouTimeHandler');
const iPhoneHandler = require('./iPhoneHandler');

const commandHandler = (message, reply, privateReply, isMessageFromMod) => {
  const commandPrefix = ".";
  
  // respond to things that arent' explicit commands
  const tokens = message.trim().split(
    / +/g); 
    
  // brus
  const dateStrings = [
    "days", 
    "day", 
    "weeks", 
    "week", 
    "months", 
    "month", 
    "hours", 
    "hour", 
    "minutes", 
    "minute", 
    "second",
    "seconds",
  ];
  
  const numberStrings = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  
  const dateIndex = tokens.findIndex(
    token => dateStrings.includes(token.toLowerCase())
  );
  
  if (dateIndex > 0) {
    const prefix = tokens[dateIndex - 1];
    const dateType = tokens[dateIndex].toLowerCase();
    
    const convertBrus = () => {
      const decimal = Math.floor(Math.random() * 99);
      reply(`${prefix} ${dateType} is equal to approximately 0.${decimal} bru's`);
    }
    if (prefix.toLowerCase() === 'a' || prefix.toLowerCase() === 'an' || numberStrings.includes(prefix.toLowerCase())) {
      convertBrus();
    } else  {
      const parsedPrefix = parseFloat(prefix);
      switch (dateType) {
        case 'days':
        case 'day':
          if (parsedPrefix <= 135) {
            convertBrus();
          }
          break;
        case 'month':
        case 'months':
          if (parsedPrefix <= 4) {
            convertBrus();
          }
          break;
        case 'weeks':
        case 'week':
          if (parsedPrefix <= 19) {
            convertBrus();
          }
          break;
        case 'weeks':
        case 'week':
          if (parsedPrefix <= 19) {
            convertBrus();
          }
          break;
        case 'hours':
        case 'hour':
          if (parsedPrefix <= 3240) {
            convertBrus();
          }
          break;
        case 'minutes':
        case 'minute':
          if (parsedPrefix <= 194400) {
            convertBrus();
          }
          break;
        case 'seconds':
        case 'second':
          if (parsedPrefix <= 11664000) {
            convertBrus();
          }
          break;
      }
    }
    
  }
  
  // Ignore messages not starting with the prefix (in config.json)
  if (message.indexOf(commandPrefix) !== 0) {
    return;
  }
  
  const args = message.slice(commandPrefix.length).trim().split(
    / +/g);
  
  const command = args.shift().toLowerCase();
  
  if (args.length > 0 && args[0] === 'help') {
    // send a pm for help
    const discordCommand = Object.values(discordCommands).find(val =>
      val.command === command
    );
    if (discordCommand != null) {
      privateReply(discordCommand.description);
    }
  } else {
    const {
      ADD_MACRO,
      IPHONE,
      MACRO,
      TEXAS,
      TIME,
    } = discordCommands;
    switch (command) {
      case ADD_MACRO.command: 
        if (isMessageFromMod) {
          addMacroHandler(args, reply);
        } else {
          reply('You are not allowed to do this');
        }
        break;
      case IPHONE.command:
      console.log('here');
        iPhoneHandler(reply);
        break;
      case MACRO.command:
        macroHandler(
          args, 
          privateReply,
          reply,
        );
        break;
      case TEXAS.command:
        texasHandler(
          reply,
        );
        break;
      case TIME.command:
        ouTimeHandler(
          reply,
        );
        break;
      default:
        reply(
          "That's not a valid command! I'll PM you a list of commands if you message '.m help'"
        );
    }
  }
}

module.exports = commandHandler;