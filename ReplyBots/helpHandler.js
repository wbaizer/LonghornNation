const commands = require('./commands');

const helpHandler = (reply) => {
  const keys = Object.keys(commands);

  reply(keys.reduce(
    (acc, currentValue) => {
        const command = commands[currentValue];
        return acc + `\n\n${command.command}: ${command.description}`;
    },
    ""
  ));
}

module.exports = helpHandler