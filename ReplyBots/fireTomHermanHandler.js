const fireTomHermanHandler = (message, reply) => {
  
  const lowercase = message.toLowerCase();
  
  const firePhrases = [
    "fire tom herman",
    "fire herman",
    "fire tommy",
    "herman needs to be fired",
    "herman needs to go",
    "herman should be fired",
  ]

  if (firePhrases.find(value => lowercase.includes(value)) != null) {
    reply('https://cdn.discordapp.com/attachments/289481914384121856/593636369578983425/image0.jpg');
  }
}

module.exports = fireTomHermanHandler;