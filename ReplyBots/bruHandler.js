const bruHandler = (tokens, reply) => {
  return;
  // only do it randomly 
  if (Math.random() > 0.3) {
    return;
  }
  // brus
  const dateStrings = [
    "days", 
    "day", 
    "weeks", 
    "week", 
    "months", 
    "month", 
    "hours", 
    "hour", 
    "minutes", 
    "minute", 
    "second",
    "seconds",
  ];
  
  const numberStrings = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  
  const dateIndex = tokens.findIndex(
    token => dateStrings.includes(token.toLowerCase())
  );
  
  if (dateIndex > 0) {
    const prefix = tokens[dateIndex - 1];
    const dateType = tokens[dateIndex].toLowerCase();
    
    const convertBrus = () => {
      const decimal = Math.floor(Math.random() * 99);
      reply(`${prefix} ${dateType} is equal to approximately 0.${decimal} bru's`);
    }
    if (prefix.toLowerCase() === 'a' || prefix.toLowerCase() === 'an' || numberStrings.includes(prefix.toLowerCase())) {
      convertBrus();
    } else  {
      const parsedPrefix = parseFloat(prefix);
      switch (dateType) {
        case 'days':
        case 'day':
          if (parsedPrefix <= 135) {
            convertBrus();
          }
          break;
        case 'month':
        case 'months':
          if (parsedPrefix <= 4) {
            convertBrus();
          }
          break;
        case 'weeks':
        case 'week':
          if (parsedPrefix <= 19) {
            convertBrus();
          }
          break;
        case 'weeks':
        case 'week':
          if (parsedPrefix <= 19) {
            convertBrus();
          }
          break;
        case 'hours':
        case 'hour':
          if (parsedPrefix <= 3240) {
            convertBrus();
          }
          break;
        case 'minutes':
        case 'minute':
          if (parsedPrefix <= 194400) {
            convertBrus();
          }
          break;
        case 'seconds':
        case 'second':
          if (parsedPrefix <= 11664000) {
            convertBrus();
          }
          break;
      }
    }
    
  }
}

module.exports = bruHandler
