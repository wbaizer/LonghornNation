const axios = require('axios');

const TEXAS_ID = 251;

const playerInfoHandler = (args, reply, codify) => {
  const arg = args[0];
  
  const number = parseInt(arg);
  
  
  axios.get('https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/teams/'+TEXAS_ID+'/roster?region=us&lang=en&seasontype=2&enable=broadcasts&disable=leaders')
    .then(async response => {
      // get this weeks game
      const scoreboardResponse = await axios.get('http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard');

      const {data: fullScoreboard} = scoreboardResponse;
      const {events} = fullScoreboard
      
      const texasScoreboard = events.find(e => {
        const {competitions} = e;
        const competition = competitions[0];
        const {competitors} = competition;
        return competitors.find(competitor => competitor.team.id == TEXAS_ID);
      });
      
      const {id: gameID} = texasScoreboard;
      
      const fullTexasScoreboard = (await axios.get('http://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=' + gameID)).data.boxscore;
      
      const {teams} = fullTexasScoreboard;
      
      const team1 = teams[0].team.displayName;
      const team2 = teams[1].team.displayName;
      
      const texasStats = (fullTexasScoreboard.players || []).find(stats => stats.team.id == TEXAS_ID);
      
      let playerStats = [];
      
      if (texasStats != null && texasStats.hasOwnProperty("statistics")){
          playerStats = texasStats.statistics;
      };
      
      // object of playerIDs to strings for prettys stats
      const prettyStats = {};
      const WIDTH = 7;
      // stat = passing, rushing, etc
      playerStats.forEach(({athletes, labels, name}) =>{
        athletes.forEach(({athlete, stats}) => {
          const {id} = athlete;
          if(!prettyStats.hasOwnProperty(id)) {
            prettyStats[id] = "";
          }
          
          prettyStats[id] += "**" + name.toUpperCase() + "**" + "\n";
          
          let codePart = "";
          
          for (i  = 0; i < labels.length; i++) {
            codePart += labels[i];
            for (j = 0; j < WIDTH - labels[i].length; j++ ) {
              codePart += " ";
            }
            codePart += "|";
          }
          
          codePart+= "\n";
          for(i = 0; i < labels.length * (WIDTH + 1); i++) {
            codePart += "-";
          }
          codePart += "\n";
          
          
          for (i  = 0; i < stats.length; i++) {
            codePart += stats[i];
            for (j = 0; j < WIDTH - stats[i].length; j++ ) {
              codePart += " ";
            }
            codePart += "|";
          }
          prettyStats[id] += codify(codePart) + "\n";
          
        })
      });
      
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
              if (player.jersey) {
                let stats = "";
                
                if (prettyStats.hasOwnProperty(player.id)) {
                  stats =  prettyStats[player.id];
                }
                return `${accumulator}${displayName}: ${player.position.abbreviation} #${player.jersey}, ${player.experience.displayValue}\nStats for ${team1} vs. ${team2} game\n\n${stats}`;
              }
            }, 
            "Here is the info I could find\n\n"
          )
        );
        
      }
    })
  .catch(e => {
    console.error(e);
    reply('Something went wrong, please try again. If this persists, please message /u/brihoang or /u/chrislabeard');
  });
}

module.exports = playerInfoHandler;