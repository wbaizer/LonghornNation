const axios = require('axios');
const moment = require('moment');
const teamLink = require('../static_data/teams.reddit.json');

const test_ncaaf_post_schedule = require('../exampleData/ncaaf_post_schedule');
const test_ncaaf_regular_schedule = require('../exampleData/ncaaf_regular_schedule');
const test_ncaaf_standings = require('../exampleData/ncaaf_standings');
const test_ncaam_post_schedule = require('../exampleData/ncaam_post_schedule');
const test_ncaam_regular_schedule = require('../exampleData/ncaam_regular_schedule.json');
const test_ncaam_standings = require('../exampleData/ncaam_standings');

const production = process.env.PRODUCTION || false;

function fetchTeamSchedule(query, key, limit = 10) {
    if(production) {
        console.log('Hitting up ESPN for the details');
        return axios.all([
            axios.get('https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/teams/251/schedule?region=us&lang=en&seasontype=2&enable=broadcasts&disable=leaders'),
            axios.get('https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/teams/251/schedule?region=us&lang=en&seasontype=3&enable=broadcasts&disable=leaders'),
            axios.get('https://site.web.api.espn.com/apis/v2/sports/football/college-football/standings?region=us&lang=en&group=4&disable=stats&xhr=1'),
            axios.get('https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/251/schedule?region=us&lang=en&enable=broadcasts&disable=leaders&flat=true'),
            axios.get('https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/251/schedule?region=us&lang=en&seasontype=3&enable=broadcasts&disable=leaders'),
            axios.get('https://site.web.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings?region=us&lang=en&group=8&sort=vsconf_winpercent%3Adesc%2Cvsconf_wins%3Adesc%2Cvsconf_losses%3Aasc%2Cvsconf_gamesbehind%3Aasc&xhr=1')
        ])
        .then(axios.spread(function(
            ncaaf_regular_schedule,
            ncaaf_post_schedule,
            ncaaf_standings,
            ncaam_regular_schedule,
            ncaam_post_schedule,
            ncaam_standings
            ) {
            return {
                basketball: {
                    schedule: {
                    regular: mapSchedule(ncaam_regular_schedule.data),
                    post: mapSchedule(ncaam_post_schedule.data)
                    },
                    rankings: standings(ncaam_standings.data)
                },
                football: {
                    schedule: {
                    regular: mapSchedule(ncaaf_regular_schedule.data),
                    post: mapSchedule(ncaaf_post_schedule.data)
                    },
                    rankings: standings(ncaaf_standings.data)
                }
                }
            }
            ))
            .catch(error => console.log(error));
    } else {
        return new Promise(function(resolve, rejct){
            resolve({
                basketball: {
                    schedule: {
                    regular: mapSchedule(test_ncaam_regular_schedule.data),
                    post: mapSchedule(test_ncaam_post_schedule.data)
                    },
                    rankings: standings(test_ncaam_standings.data)
                },
                football: {
                    schedule: {
                    regular: mapSchedule(test_ncaaf_regular_schedule.data),
                    post: mapSchedule(test_ncaaf_post_schedule.data)
                    },
                    rankings: standings(test_ncaaf_standings.data)
                }                
            })
        });
    }
}

function mapSchedule(schedule) {
    console.log('Digesting the data');
    return schedule.events.map(event => {
      var primaryTeam = {};
      var opposingTeam = {}
      var score = [];
      var network = '';
      var complete = false;
      var homeAway = '@';
      var venue = {};
      event.competitions.forEach(game => {
        if(game.broadcasts.length > 0) {
          network = game.broadcasts[0].media.shortName;
        }
        complete = game.status.type.completed;
        venue = game.venue;
        game.competitors.forEach(team => {
          if(team.id === process.env.TEAM_ID) {
            primaryTeam = team;
            if(game.neutralSite) {
              homeAway = '';
            } else {
              if(team.homeAway == 'home') {
                homeAway = '';
              } else {
                homeAway = '@';
              }
            }    
          } else {
            team.reddit = teamLink[team.team.abbreviation];
            opposingTeam = team;           
          }
        })
      })
      
      return {
        date: moment(event.date).format('MMM D'),
        time: moment(event.date).format('h:mm a'),
        name: event.name,
        score: score,
        venue: venue,
        primaryTeam: primaryTeam,
        network: network,
        opposingTeam: opposingTeam,
        complete: complete,
        homeAway: homeAway,
      }
    });
}
function standings(standings) {
    var primaryTeamRanking = {}
    var standingTemp = standings.standings.entries.map(entry => {
      var overall = entry.stats.find(o => o.id === '0');
      var conference = entry.stats.find(o => o.id === '9');
        if(entry.team.id === process.env.TEAM_ID) {
          primaryTeamRanking = {
            overall: overall.displayValue,
            conference: conference.displayValue
          }
        }
        return {
          name: entry.team.location,
          id: entry.team.id,
          rank: entry.team.rank,
          abbreviation: entry.team.abbreviation,
          overall: overall.displayValue,
          conference: conference.displayValue
        }
    })
    return {primaryTeam: primaryTeamRanking, teams: standingTemp}
}
module.exports = {
    fetchTeamSchedule
};