const fireShakaHandler = (message, reply) => {
  
  const lowercase = message.toLowerCase();
  
  const firePhrases = [
    "fire shaka",
    "fire smart",
    "shaka needs to be fired",
    "smart needs to be fired",
    "shaka needs to go",
    "smart needs to go",
    "shaka should be fired",
    "smart should be fired",
    "we must kill the shak",
    "fire shakath",
  ]

  if (firePhrases.find(value => lowercase.includes(value)) != null) {
    reply('[](https://i.imgur.com/kFfBUg0.png)');
  }
}

module.exports = fireShakaHandler;