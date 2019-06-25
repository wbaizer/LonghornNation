const ouTimeHandler = (send) => {
  const localTime = new Date();
  const time = localTime.toLocaleTimeString(
    'en-US', 
    {
      timeZone: "America/Chicago", 
      hour12: true, 
      hour: '2-digit', 
      minute:'2-digit'
    },
  );
  
  send(
    `It's ${time} in Austin, and OU still sucks!`
  );
}

module.exports = ouTimeHandler;