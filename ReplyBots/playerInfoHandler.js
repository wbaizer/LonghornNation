const axios = require('axios');
const playerInfoHandler = (args, reply) => {
  const arg = args[0];
  
  const number = parseInt(arg);
  
  axios.get('https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/teams/251/roster?region=us&lang=en&seasontype=2&enable=broadcasts&disable=leaders')
    .then(response => {
      const roster = response.data.athletes;
      const rosterArray = roster.map(r => r.items);
      
      let matchingPlayers = [];
      
      rosterArray.forEach(r => 
        r.forEach(player => {
          // searching by number
          if(number > 0) {
            if (player.jersey === arg) {
              matchingPlayers.push(player);
            }
          } else if (player.fullName.toLowerCase().includes(arg)) {
            matchingPlayers.push(player);
          }
        })
      );
      
      // print matching matching players 
      if (matchingPlayers.length === 0) {
        reply(`Could not find any matching players.`);
      } else {
        reply(
          matchingPlayers.reduce(
            (accumulator, player) => {
              const displayName = player.displayName === "Sam Ehlinger" ? "Daddy Ehlinger" : player.displayName;
              if (player.jersey) 
              return `${accumulator}\n\n${displayName}: ${player.position.abbreviation} #${player.jersey}, ${player.experience.displayValue}`
            }, 
            "Here is the info I could find"
          )
        );
        
      }
    })
  .catch(e => {
    send('Something went wrong, please try again. If this persists, please message /u/brihoang or /u/chrislabeard');
  });
}

module.exports = playerInfoHandler;