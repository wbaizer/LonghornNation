const teamLink = require('../static_data/teams.reddit.json');
const baseballRemap = require('../static_data/baseball_remap.json');

function formatTeam(team) {
  return {
    id: team.id,
    displayName: team.team.displayName,
    nickname: team.team.nickname,
    winner: team.winner,
    rank: team.curatedRank ? team.curatedRank.current : 999,
    score: team.score ? team.score.displayValue : '0',
    homeAway: team.homeAway === 'home' ? 'vs' : '@',
    reddit: teamLink[team.team.abbreviation] ? teamLink[team.team.abbreviation] : ''
  }
}

module.exports = {
  formatTeam
}