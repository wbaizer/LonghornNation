const axios = require('axios');
const moment = require('moment');
const teamLink = require('../static_data/teams.reddit.json');
const baseballRemap = require('../static_data/baseball_remap.json');
const teamABR = require('../static_data/teams.abr.json');
const { gameThread } = require('../utils/gameThread');
const { texasSports }= require('../utils/service');
const test_ncaaf_post_schedule = require('../exampleData/ncaaf_post_schedule');
const test_ncaaf_regular_schedule = require('../exampleData/ncaaf_regular_schedule');
const test_ncaaf_standings = require('../exampleData/ncaaf_standings');
const test_ncaam_post_schedule = require('../exampleData/ncaam_post_schedule');
const test_ncaam_regular_schedule = require('../exampleData/ncaam_regular_schedule.json');
const test_ncaam_standings = require('../exampleData/ncaam_standings');

const production = process.env.PRODUCTION || false;
var jobsList = {};

async function fetchTeamSchedule(agenda) {

  if(production) {
        console.log('Hitting up ESPN for the details');
        var baseballData = await texasSports(agenda);
        return axios.all([
            axios.get('https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/teams/' + process.env.TEAM_ID + '/schedule?region=us&lang=en&seasontype=2&enable=broadcasts&disable=leaders'),
            axios.get('https://site.web.api.espn.com/apis/site/v2/sports/football/college-football/teams/' + process.env.TEAM_ID + '/schedule?region=us&lang=en&seasontype=3&enable=broadcasts&disable=leaders'),
            axios.get('https://site.web.api.espn.com/apis/v2/sports/football/college-football/standings?region=us&lang=en&group=4&disable=stats&xhr=1'),
            axios.get('https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/' + process.env.TEAM_ID + '/schedule?region=us&lang=en&enable=broadcasts&disable=leaders&flat=true'),
            axios.get('https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/' + process.env.TEAM_ID + '/schedule?region=us&lang=en&seasontype=3&enable=broadcasts&disable=leaders'),
            axios.get('https://site.web.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings?region=us&lang=en&group=8&sort=vsconf_winpercent%3Adesc%2Cvsconf_wins%3Adesc%2Cvsconf_losses%3Aasc%2Cvsconf_gamesbehind%3Aasc&xhr=1'),
            axios.get('http://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/126/schedule?seasontype=2&enable=broadcasts&disable=leaders'),
            axios.get('http://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/126/schedule?seasontype=3&enable=broadcasts&disable=leaders')
        ])
        .then(axios.spread(function(
            ncaaf_regular_schedule,
            ncaaf_post_schedule,
            ncaaf_standings,
            ncaam_regular_schedule,
            ncaam_post_schedule,
            ncaam_standings,
            baseball_regular_schedule,
            baseball_post_schedule
            ) {
              return {
                basketball: {
                    schedule: {
                      regular: mapSchedule(ncaam_regular_schedule.data, agenda, 'basketball'),
                      post: mapSchedule(ncaam_post_schedule.data, agenda, 'basketball')
                    },
                    rankings: standings(ncaam_standings.data)
                },
                football: {
                    schedule: {
                    regular: mapSchedule(ncaaf_regular_schedule.data, agenda, 'football'),
                    post: mapSchedule(ncaaf_post_schedule.data, agenda, 'football')
                    },
                    rankings: standings(ncaaf_standings.data)
                },
                baseball: {
                    schedule: {
                      regular: mapSchedule(baseball_regular_schedule.data, agenda, 'baseball'),
                      post: mapSchedule(baseball_post_schedule.data, agenda, 'baseball')
                    },
                    rankings: baseballData.rankings
                }
              }
            }
            ));
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

function mapSchedule(schedule, agenda, sport) {
    console.log('Digesting the data');
    console.log()
    return schedule.events.map(event => {
      var primaryTeam = {};
      var opposingTeam = {}
      var score = [];
      var network = '';
      var complete = false;
      var status = '';
      var homeAway = '@';
      var venue = {};
      var checkID = process.env.TEAM_ID;
      if(sport == 'baseball') {
        checkID = "126";
      }
      event.competitions.forEach(game => {
        if(process.env.GAME_THREAD.includes(sport)) {
          if(moment(event.date).isAfter(Date.now())) {
            var scheduleDate = moment(event.date).subtract(2, 'hours').toDate();
            if (game.status.type.name === 'STATUS_CANCELED' || game.status.type.name === 'STATUS_POSTPONED') {
              console.log(`CANCEL: ${sport} - game thread: ${event.name}`, moment(scheduleDate).fromNow());
              agenda.cancel({'game_id' : event.id})
            } else {
              console.log(`${sport} - game thread: ${event.name}`, moment(scheduleDate).fromNow());
              agenda.create('CREATE: game thread', {event: event, sport: sport}).unique({'game_id': event.id}).schedule(scheduleDate).save();
            }
          }
        }
        if(game.broadcasts.length > 0) {
          network = game.broadcasts[0].media.shortName;
        }
        status = game.status.type.name
        complete = game.status.type.completed;
        venue = game.venue;
        game.competitors.forEach(team => {
          if(!team.team.nickname) {
            team.team.nickname = team.team.location;
          }
          if(team.id === checkID) {
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
            
            if(teamLink[team.team.abbreviation]) {
              team.reddit = teamLink[team.team.abbreviation];
            } else {
              var alt = baseballRemap[team.team.abbreviation];
              team.reddit = teamLink[alt];
            }
            opposingTeam = team;           
          }
        })
      })
      return {
        date: moment(event.date).format('MMM D'),
        time: moment(event.date).format('h:mm a'),
        dateISO: event.date,
        name: event.name,
        timeValid: event.timeValid,
        score: score,
        venue: venue,
        primaryTeam: primaryTeam,
        network: network,
        opposingTeam: opposingTeam,
        complete: complete,
        homeAway: homeAway,
        status: status
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
