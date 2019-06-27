const bruHandler = require('./bruHandler');
const fireTomHermanHandler = require('./fireTomHermanHandler');
const fireShakaHandler = require('./fireShakaHandler');


const easterEggHandler = (message, reply) => {
  const tokens = message.trim().split(
    / +/g); 
      
  bruHandler(tokens, reply);
  fireTomHermanHandler(message, reply);
  fireShakaHandler(message, reply);
}

module.exports = easterEggHandler;