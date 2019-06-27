const bruHandler = require('./bruHandler');
const fireTomHermanHandler = require('./fireTomHermanHandler');

const easterEggHandler = (message, reply) => {
  const tokens = message.trim().split(
    / +/g); 
    
  bruHandler(tokens, reply);
  fireTomHermanHandler(message, reply);
}

module.exports = easterEggHandler;