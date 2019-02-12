const discordMacros = require('./discordmacros');

const discordMacroHandler = (args, message) => {
  if (args.length > 0) {
    const macro = discordMacros[args[0]];
    if (args[0] === 'list') {
      // pm a list of macros to the author
      const list = Object.keys(discordMacros).reduce((acc, curr) =>
        curr + ": <" + discordMacros[curr] + ">\n" + acc, "");
      message.author.send(list);
    } else if (macro != null && macro.length > 0) {

      message.channel.send(macro);
    } else {
      message.channel.send(
        'That macro does not exist. If you think it should be, ask a mod to add it'
      );
    }
  } else {
    message.channel.send(
      "I can't send a macro if you don't give me a name!"
    );
  }
}

module.exports = discordMacroHandler;
