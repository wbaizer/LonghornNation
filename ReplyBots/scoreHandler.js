const axios = require('axios');
const moment = require('moment-timezone');

const ESPN_GAME_STATUSES = Object.freeze({"STATUS_SCHEDULED" : "STATUS_SCHEDULED", "STATUS_FINAL": "STATUS_FINAL", "STATUS_IN_PROGRESS": "STATUS_IN_PROGRESS"})

const ordinalConverter = (num) => {
  switch (num) {
    case 1:
      return "1st quarter";
    case 2:
      return "2nd quarter";
    case 3:
      return "3rd quarter";
    case 4:
      return "4th quarter";
    default:
      return `OT${num - 4}`;
  }
}

const spacify = (s, width) => {
  let ret = s;
  for(i = 0; i < width - s.length; i++) {
    ret += " ";
  }
  return ret;
}

const repeat = (c, width) => {
  let ret = "";
  for (i = 0; i < width; i++) {
    ret += c;
  }
  return ret;
}

const prettifyScoreboard = (scoreboard) => {
  const width = 9;
  const competition = scoreboard.competitions[0];
  const firstTeamGiven = competition.competitors[0];
  const secondTeamGiven =  competition.competitors[1];
  const homeTeam = firstTeamGiven.homeAway == "home" ? firstTeamGiven : secondTeamGiven;
  const awayTeam = firstTeamGiven.homeAway == "away" ? firstTeamGiven : secondTeamGiven;
  
  const secondTeam = homeTeam.team.abbreviation;
  const firstTeam = awayTeam.team.abbreviation;
  
  const status = competition.status.type.name;
  const team1Rank = awayTeam.curatedRank.current;
  const team2Rank = homeTeam.curatedRank.current;
  
  let team1DisplayRank = team1Rank > 25 ? "   " : spacify(`#${team1Rank}`, 3);
  let team2DisplayRank = team2Rank > 25 ? "   " : spacify(`#${team2Rank}`, 3);
  
  if (team1Rank > 25 && team2Rank  > 25) {
    team1DisplayRank = "";
    team2DisplayRank = "";
  }

  let line1Extra = "";
  let line2Extra = "";
  let extraWidth = 0;
  
  switch (status) {
    case ESPN_GAME_STATUSES.STATUS_SCHEDULED:
      const startDate = new Date(competition.startDate);
      let hours = startDate.getHours();
      const ampm = hours > 11 > 0 ? "PM" :  "AM";
      if (hours > 11 > 0) {
        hours %= 12;
      }
      const minutes = startDate.getMinutes();
      extraWidth = 13;
      const formatedMinutes = minutes < 10 ? `0${minutes}` :  minutes;
      const date = new Date();
      
      let formattedDate = "";
      if (date.getDate() != startDate.getDate()) {
        formattedDate = (startDate.getMonth() + 1) + "/" + startDate.getDate() + " ";
      }
      line1Extra = repeat(" ", extraWidth);
      line2Extra = spacify(` ${formattedDate}${hours}:${formatedMinutes} ${ampm}`, extraWidth);
      
      break;  
    case ESPN_GAME_STATUSES.STATUS_FINAL:
      const score1 = competition.competitors[0].score;
      const score2 = competition.competitors[1].score;
      
      line1Extra = spacify(score1, 3) + "|" + repeat(" ", 3);
      line2Extra = spacify(score2, 3) + "|" + spacify("F", 3);
      extraWidth = 7;
      break;
    case ESPN_GAME_STATUSES.STATUS_IN_PROGRESS:
      const score1inProgress = competition.competitors[0].score;
      const score2inProgress = competition.competitors[1].score;
      const clock = competition.status.displayClock;
      const period = ordinalConverter(competition.status.period);
      
      
      line1Extra = spacify(score1inProgress, 3) + "|" + spacify(clock, 5);
      line2Extra = spacify(score2inProgress, 3) + "|" + spacify(period, 5);
      extraWidth = 9;
      break;
  }
  const line = repeat('-', width + 1 + extraWidth + 1) + "|\n";
  
  return line + "|" + spacify(`${team1DisplayRank}${firstTeam}`, width) + "|" + line1Extra + "|\n" 
  + line + "|" + spacify(`${team2DisplayRank}${secondTeam}`, width) + "|" + line2Extra + "|\n" +line;
}

const scoreHandler = (send, codify) => {
  const url = 'http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=4';
  
  axios.get(url).then(({data}) => {
    const {events: allEvents} = data;
    
    
    send(allEvents.reduce((acc, score) => {
      return acc + codify(prettifyScoreboard(score));
    }, ""));

  }).catch (e => {
    console.error(e);
    send('Something went wrong, please try again. If this persists, please message /u/brihoang or /u/chrislabeard')
  }) ;  
}

module.exports = scoreHandler;