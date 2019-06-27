const fireTomHermanHandler = (message, reply) => {
  
  const lowercase = message.toLowerCase();
  
  const firePhrases = [
    "fire tom herman",
    "fire herman",
    "fire tommy",
    "herman needs to be fired",
    "herman needs to go",
    "herman should be fired",
    "we must kill the herm",
    "fire thomas",
    "fire big time tommy john",
    "fire titter tom",
  ]

  if (firePhrases.find(value => lowercase.includes(value)) != null) {
    reply('[](https://i.imgur.com/me3h0ao.jpg)');
  }
}

module.exports = fireTomHermanHandler;