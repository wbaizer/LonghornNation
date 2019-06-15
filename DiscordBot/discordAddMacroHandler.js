const fs = require('fs');

const rawData = fs.readFileSync('./discordmacros.json');
let discordMacros = JSON.parse(rawData);

fs.watch('./discordmacros.json', (event, filename) => {
  discordMacros = JSON.parse(fs.readFileSync(filename));
});

const ELIGIBLE_ROLES = ['Mods', 'Coders'];

const discordMacroHandler = (args, message) => {  
  // check that user is allowed to do this
  
  const matchedEligibleRoles = message.member.roles.filter(r => ELIGIBLE_ROLES.indexOf(r.name) >= 0);
  if (Array.from(matchedEligibleRoles).length > 0) {
    if (args.length > 1) {
      const macroName = args[0];
      const macroValue = args[1];
      
      const newMacros = {
        ...discordMacros,
      }
      
      newMacros[macroName] = macroValue;
      
      const newMacrosString = JSON.stringify(newMacros, null, 2);
      fs.writeFileSync('./discordmacros.json', newMacrosString);
      message.channel.send(
        "Successfully added new macro!"
      );
    } else {
      message.channel.send(
        "Insufficient arguments"
      );
    }
  } else {
    message.channel.send(
      "You are not allowed to do this"
    );
  }
}

module.exports = discordMacroHandler;
