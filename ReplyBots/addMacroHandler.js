const fs = require('fs');

const rawData = fs.readFileSync('./discordmacros.json');
let discordMacros = JSON.parse(rawData);

fs.watch('./discordmacros.json', (event, filename) => {
  discordMacros = JSON.parse(fs.readFileSync(filename));
});

const discordMacroHandler = (args, send) => {  
  if (args.length === 2) {
    const macroName = args[0].toLowerCase();
    const macroValue = args[1];
    
    const newMacros = {
      ...discordMacros,
    }
    
    newMacros[macroName] = macroValue;
    
    const newMacrosString = JSON.stringify(newMacros, null, 2);
    fs.writeFileSync('./discordmacros.json', newMacrosString);
    send(
      "Successfully added new macro!"
    );
  } else {
    send(
      "Insufficient arguments. You must have exactly 2 arguments"
    );
  }
}

module.exports = discordMacroHandler;
