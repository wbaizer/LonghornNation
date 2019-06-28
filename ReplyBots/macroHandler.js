const fs = require('fs');
const rawData = fs.readFileSync('./discordmacros.json');
let discordMacros = JSON.parse(rawData);
fs.watch('./discordmacros.json', (event, filename) =>{discordMacros = JSON.parse(fs.readFileSync(filename))});

const discordMacroHandler = (args, privateSend, send) => {
  if (args.length > 0) {
    const macro = discordMacros[args[0].toLowerCase()];
    if (args[0] === 'list') {
      // pm a list of macros to the author
      const list = Object.keys(discordMacros).reduce((acc, curr) =>
        curr + ": <" + discordMacros[curr] + ">\n" + acc, "");
      privateSend(list);
    } else if (macro != null && macro.length > 0) {
      send(macro);
    } else {
      send(
        'That macro does not exist. If you think it should be, ask a mod to add it'
      );
    }
  } else {
    send(
      "I can't send a macro if you don't give me a name!"
    );
  }
}

module.exports = discordMacroHandler;
