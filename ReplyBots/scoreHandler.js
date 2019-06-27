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

const scoreHandler = (send) => {
  const url = 'https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/teams/251/schedule?region=us&lang=en&seasontype=2&enable=broadcasts&disable=leaders';
  
  const test = axios.get(url).then(response => {
    const events = response.data.events;
    
    const currentTime = moment();
    
    const gameEvent = events.find(
      e => {
        const eventMoment = moment(e.date);
        return currentTime.diff(eventMoment, 'days') < 3;
      }
    );
    
    const gameMoment = moment.tz(gameEvent.date, 'America/Chicago');
    const gameStatusObject = gameEvent.competitions[0].status;
    const gameStatus = gameStatusObject.type.name;
    
    const competitors = gameEvent.competitions[0].competitors;
    
    const team1 = competitors[0];
    const team2 = competitors[1];
    
    if (gameStatus === ESPN_GAME_STATUSES.STATUS_SCHEDULED) {
      const formattedGameDate = gameMoment.format('MM/DD h:mm A');
      send(`${gameEvent.name} begins on ${formattedGameDate} CT`);
    } else if (gameStatus === ESPN_GAME_STATUSES.STATUS_IN_PROGRESS) {
      let message = "";
      if (team1.score > team2.score) {
        message = `${team1.team.location} leads ${team2.team.location}`;
      } else {
        message = `${team2.team.location} leads ${team1.team.location}`;  
      }
      message += `by a score of ${team1.team.score} to ${team2.team.score} with ${gameStatusObject.displayClock} left in the ${ordinalConverter(gameStatusObject.period)}`;
      
      send(message);
      
    } else if (gameStatus === ESPN_GAME_STATUSES.STATUS_FINAL) {
      if (team1.score > team2.score) {
        send(`${team1.team.location} defeated ${team2.team.location} by a score of ${team1.team.score} to ${team2.team.score}`);
      } else {
        send(`${team2.team.location} defeated ${team1.team.location} by a score of ${team2.team.score} to ${team1.team.score}`);  
      }
    }
  }).catch (e => {
    send('Something went wrong, please try again. If this persists, please message /u/brihoang or /u/chrislabeard')
  }) ;  
}

module.exports = scoreHandler;